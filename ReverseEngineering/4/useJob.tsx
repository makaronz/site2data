import { useState, useEffect } from "react";

const useJob = (jobId:string)=>{
  const [pct,setPct]  = useState(0);
  const [data,setData]= useState<any>({});
  useEffect(()=>{
    const sse = new EventSource(`/api/job/${jobId}/events`);
    sse.onmessage = e => {
      const msg = JSON.parse(e.data);
      setPct(msg.percent);
      if(msg.section) setData((d:any) => ({...d,[msg.section]:msg.payload}));
      if(msg.type==="done") window.open(msg.zip,"_blank");
    };
    return ()=>sse.close();
  },[jobId]);
  return {pct,data};
};

export default useJob; 