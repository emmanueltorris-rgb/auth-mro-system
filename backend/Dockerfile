# backend/Dockerfile
FROM python:3.10-slim

WORKDIR /app

# Copy requirements first to leverage Docker caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . .

# Expose the port your Flask app runs on
EXPOSE 5000

# Run the app
CMD ["python", "app.py"]