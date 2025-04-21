import cv2
import numpy as np
from moviepy.editor import VideoFileClip
import ffmpeg
import os
from PIL import Image
import pytesseract
from skimage import measure
import json
from typing import List, Dict, Any

class MediaProcessor:
    def __init__(self, output_dir: str = "downloaded_content"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        
    def extract_video_metadata(self, video_path: str) -> Dict[str, Any]:
        """Extract technical metadata from video file."""
        try:
            probe = ffmpeg.probe(video_path)
            video_info = next(s for s in probe['streams'] if s['codec_type'] == 'video')
            
            metadata = {
                'codec': video_info['codec_name'],
                'width': int(video_info['width']),
                'height': int(video_info['height']),
                'frame_rate': eval(video_info['r_frame_rate']),
                'duration': float(probe['format']['duration']),
                'bitrate': int(probe['format']['bit_rate']),
                'format': probe['format']['format_name']
            }
            return metadata
        except Exception as e:
            print(f"Error extracting video metadata: {e}")
            return {}

    def extract_frames(self, video_path: str, interval: float = 1.0) -> List[str]:
        """Extract frames from video at specified interval."""
        frames = []
        try:
            clip = VideoFileClip(video_path)
            fps = clip.fps
            frame_interval = int(fps * interval)
            
            frames_dir = os.path.join(self.output_dir, "frames")
            os.makedirs(frames_dir, exist_ok=True)
            
            for i, frame in enumerate(clip.iter_frames()):
                if i % frame_interval == 0:
                    frame_path = os.path.join(frames_dir, f"frame_{i}.jpg")
                    cv2.imwrite(frame_path, cv2.cvtColor(frame, cv2.COLOR_RGB2BGR))
                    frames.append(frame_path)
            
            clip.close()
            return frames
        except Exception as e:
            print(f"Error extracting frames: {e}")
            return []

    def detect_scene_changes(self, video_path: str, threshold: float = 30.0) -> List[float]:
        """Detect scene changes in video using frame differences."""
        scene_changes = []
        try:
            cap = cv2.VideoCapture(video_path)
            ret, prev_frame = cap.read()
            if not ret:
                return []
            
            prev_frame = cv2.cvtColor(prev_frame, cv2.COLOR_BGR2GRAY)
            frame_count = 0
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                diff = cv2.absdiff(frame, prev_frame)
                diff_mean = np.mean(diff)
                
                if diff_mean > threshold:
                    scene_changes.append(frame_count / cap.get(cv2.CAP_PROP_FPS))
                
                prev_frame = frame
                frame_count += 1
            
            cap.release()
            return scene_changes
        except Exception as e:
            print(f"Error detecting scene changes: {e}")
            return []

    def analyze_frame(self, frame_path: str) -> Dict[str, Any]:
        """Analyze single frame for content and metadata."""
        try:
            img = cv2.imread(frame_path)
            if img is None:
                return {}
            
            # Convert to grayscale for analysis
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Perform OCR
            text = pytesseract.image_to_string(Image.open(frame_path))
            
            # Detect edges
            edges = cv2.Canny(gray, 100, 200)
            
            # Calculate image statistics
            stats = {
                'brightness': np.mean(gray),
                'contrast': np.std(gray),
                'edges_density': np.mean(edges) / 255.0,
                'text_content': text.strip(),
                'width': img.shape[1],
                'height': img.shape[0]
            }
            
            return stats
        except Exception as e:
            print(f"Error analyzing frame: {e}")
            return {}

    def detect_shot_type(self, frame_path: str) -> str:
        """Detect the type of shot in a frame."""
        try:
            img = cv2.imread(frame_path)
            if img is None:
                return "unknown"
            
            height, width = img.shape[:2]
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            faces = face_cascade.detectMultiScale(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), 1.1, 4)
            
            if len(faces) > 0:
                face_area = sum(w * h for (x, y, w, h) in faces)
                frame_area = width * height
                face_ratio = face_area / frame_area
                
                if face_ratio > 0.3:
                    return "close-up"
                elif face_ratio > 0.1:
                    return "medium shot"
                else:
                    return "wide shot"
            else:
                return "wide shot"
        except Exception as e:
            print(f"Error detecting shot type: {e}")
            return "unknown"

    def analyze_scene_mood(self, frame_path: str) -> Dict[str, float]:
        """Analyze the mood of a scene based on color and composition."""
        try:
            img = cv2.imread(frame_path)
            if img is None:
                return {}
            
            # Convert to HSV for color analysis
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            
            # Calculate color statistics
            h_mean = np.mean(hsv[:,:,0])
            s_mean = np.mean(hsv[:,:,1])
            v_mean = np.mean(hsv[:,:,2])
            
            # Calculate mood indicators
            mood = {
                'brightness': v_mean / 255.0,
                'saturation': s_mean / 255.0,
                'warmth': 1.0 - (h_mean / 180.0) if h_mean < 90 else (h_mean - 90) / 90.0,
                'contrast': np.std(img) / 255.0
            }
            
            return mood
        except Exception as e:
            print(f"Error analyzing scene mood: {e}")
            return {}

    def detect_objects(self, frame_path: str) -> List[Dict[str, Any]]:
        """Detect objects in a frame using OpenCV."""
        try:
            img = cv2.imread(frame_path)
            if img is None:
                return []
            
            # Convert to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Detect edges
            edges = cv2.Canny(gray, 100, 200)
            
            # Find contours
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            objects = []
            for contour in contours:
                if cv2.contourArea(contour) > 1000:  # Filter small objects
                    x, y, w, h = cv2.boundingRect(contour)
                    objects.append({
                        'position': {'x': x, 'y': y, 'width': w, 'height': h},
                        'area': cv2.contourArea(contour),
                        'perimeter': cv2.arcLength(contour, True)
                    })
            
            return objects
        except Exception as e:
            print(f"Error detecting objects: {e}")
            return []

    def generate_tags(self, frame_path: str) -> List[str]:
        """Generate tags for a frame based on analysis."""
        try:
            tags = []
            
            # Add shot type tag
            shot_type = self.detect_shot_type(frame_path)
            tags.append(f"shot:{shot_type}")
            
            # Add mood tags
            mood = self.analyze_scene_mood(frame_path)
            if mood:
                if mood['brightness'] > 0.7:
                    tags.append("bright")
                elif mood['brightness'] < 0.3:
                    tags.append("dark")
                
                if mood['warmth'] > 0.7:
                    tags.append("warm")
                elif mood['warmth'] < 0.3:
                    tags.append("cool")
            
            # Add object tags
            objects = self.detect_objects(frame_path)
            if len(objects) > 0:
                tags.append(f"objects:{len(objects)}")
            
            # Add text content tags
            text = pytesseract.image_to_string(Image.open(frame_path))
            if text.strip():
                tags.append("contains_text")
            
            return tags
        except Exception as e:
            print(f"Error generating tags: {e}")
            return []

    def process_video(self, video_path: str) -> Dict[str, Any]:
        """Process video file and generate comprehensive analysis."""
        try:
            # Extract metadata
            metadata = self.extract_video_metadata(video_path)
            
            # Extract frames
            frames = self.extract_frames(video_path)
            
            # Detect scene changes
            scene_changes = self.detect_scene_changes(video_path)
            
            # Analyze frames and generate tags
            frame_analysis = []
            for frame_path in frames:
                analysis = self.analyze_frame(frame_path)
                tags = self.generate_tags(frame_path)
                mood = self.analyze_scene_mood(frame_path)
                objects = self.detect_objects(frame_path)
                
                frame_analysis.append({
                    **analysis,
                    'tags': tags,
                    'mood': mood,
                    'objects': objects,
                    'shot_type': self.detect_shot_type(frame_path)
                })
            
            # Generate report
            report = {
                'metadata': metadata,
                'scene_changes': scene_changes,
                'frame_analysis': frame_analysis,
                'total_frames_analyzed': len(frames),
                'summary_tags': list(set(tag for frame in frame_analysis for tag in frame['tags']))
            }
            
            # Save report
            report_path = os.path.join(self.output_dir, "video_analysis.json")
            with open(report_path, 'w') as f:
                json.dump(report, f, indent=4)
            
            return report
        except Exception as e:
            print(f"Error processing video: {e}")
            return {} 