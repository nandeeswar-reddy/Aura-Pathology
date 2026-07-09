# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV APP_ENV production
ENV HOST 0.0.0.0
ENV PORT 8000

# Set the working directory in the container
WORKDIR /app

# Install system dependencies (needed for compiling some python packages and opencv/pillow)
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
COPY requirements.txt /app/

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . /app/

# Create a volume for persistent database and uploads
VOLUME ["/app/backend/uploads"]

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["python", "run.py"]
