# Deployment Guide for Site2Data

This guide will help you deploy the Site2Data application to Render, a cloud platform that offers a free tier for web services.

## Prerequisites

- A Render account (sign up at [render.com](https://render.com))
- Git installed on your local machine
- A GitHub, GitLab, or Bitbucket account

## Step 1: Prepare Your Application for Deployment

1. Create a `requirements.txt` file (already done)
2. Create a `Procfile` for specifying how to run your application:

```
web: gunicorn app:app
```

3. Add gunicorn and Flask to your requirements.txt:

```
gunicorn
Flask
```

4. Make sure your .env file is in .gitignore (it should not be committed to version control)

5. Note about system dependencies:
   - The application requires `pdftotext` (part of poppler-utils) for PDF processing
   - An `install_dependencies.sh` script is provided to install this on your server
   - On Render, you can add this as a build command: `bash install_dependencies.sh`

## Step 2: Use the Existing GitHub Repository

Since this application already has a GitHub repository, you can simply:

1. Make sure your changes are committed:
```bash
git add .
git commit -m "Prepare for deployment"
```

2. Push your changes to the repository:
```bash
git push
```

## Step 3: Deploy to Render

1. Log in to your Render account
2. Click on "New" and select "Web Service"
3. Connect your GitHub/GitLab/Bitbucket account and select your repository
4. Configure your web service:
   - Name: site2data (or any name you prefer)
   - Environment: Python
   - Build Command: `bash install_dependencies.sh && pip install -r requirements.txt`
   - Start Command: `gunicorn app:app`
   - Select the free plan

5. Add environment variables:
   - Click on "Environment" tab
   - Add the following environment variable:
     - Key: `OPENAI_API_KEY`
     - Value: Your OpenAI API key

6. Click "Create Web Service"

Render will automatically build and deploy your application. Once the deployment is complete, you can access your application at the URL provided by Render.

## Step 4: Additional Configuration (Optional)

### Custom Domain

If you want to use a custom domain:
1. Go to your web service settings
2. Click on "Custom Domain"
3. Follow the instructions to add your domain

### Scaling

If you need more resources:
1. Go to your web service settings
2. Click on "Change Plan"
3. Select a plan that meets your requirements

## Important Notes

1. **API Key Security**: Be careful with your OpenAI API key. Never commit it to your repository. Always use environment variables.

2. **Storage**: Render's free tier has ephemeral storage, meaning files created during the application's runtime (like downloaded PDFs) will be lost when the service restarts. For persistent storage, consider:
   - Using a cloud storage service like AWS S3 or Google Cloud Storage
   - Upgrading to a paid Render plan with persistent disk

3. **Usage Limits**: Be mindful of OpenAI API usage limits and costs, especially if your application gets heavy traffic.

4. **Performance**: The free tier has limited resources. If your application needs more processing power, consider upgrading to a paid plan.

## Troubleshooting

- If your application fails to deploy, check the build logs for errors
- Make sure all required packages are in your requirements.txt
- Verify that your Procfile is correctly configured
- Ensure your OpenAI API key is correctly set in the environment variables
