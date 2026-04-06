"""
S3 utility functions for uploading, downloading, and managing files in AWS S3
"""
import os
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv
from typing import Optional, Tuple
import io

load_dotenv()

# AWS S3 Configuration
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
AWS_S3_BUCKET_NAME = os.environ.get("AWS_S3_BUCKET_NAME")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

# Initialize S3 client
s3_client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)


def upload_file_to_s3(file_path: str, s3_key: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Upload a file from local filesystem to S3.
    
    Args:
        file_path: Path to local file
        s3_key: S3 object key (path within bucket)
    
    Returns:
        Tuple of (success: bool, s3_url: Optional[str], error: Optional[str])
    """
    try:
        if not os.path.exists(file_path):
            return False, None, f"File not found: {file_path}"
        
        with open(file_path, 'rb') as f:
            s3_client.upload_fileobj(
                f,
                AWS_S3_BUCKET_NAME,
                s3_key,
                ExtraArgs={'ContentType': 'image/jpeg'}
            )
        
        # Generate S3 URL
        s3_url = f"s3://{AWS_S3_BUCKET_NAME}/{s3_key}"
        return True, s3_url, None
    
    except ClientError as e:
        error_msg = f"S3 upload error: {e}"
        print(error_msg)
        return False, None, error_msg
    except Exception as e:
        error_msg = f"Unexpected error during upload: {e}"
        print(error_msg)
        return False, None, error_msg


def upload_file_obj_to_s3(file_obj, s3_key: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Upload a file-like object to S3.
    
    Args:
        file_obj: File-like object (from Flask request.files)
        s3_key: S3 object key (path within bucket)
    
    Returns:
        Tuple of (success: bool, s3_url: Optional[str], error: Optional[str])
    """
    try:
        s3_client.upload_fileobj(
            file_obj,
            AWS_S3_BUCKET_NAME,
            s3_key,
            ExtraArgs={'ContentType': 'image/jpeg'}
        )
        
        s3_url = f"s3://{AWS_S3_BUCKET_NAME}/{s3_key}"
        return True, s3_url, None
    
    except ClientError as e:
        error_msg = f"S3 upload error: {e}"
        print(error_msg)
        return False, None, error_msg
    except Exception as e:
        error_msg = f"Unexpected error during upload: {e}"
        print(error_msg)
        return False, None, error_msg


def download_file_from_s3(s3_key: str, file_path: str) -> Tuple[bool, Optional[str]]:
    """
    Download a file from S3 to local filesystem.
    
    Args:
        s3_key: S3 object key
        file_path: Path to save file locally
    
    Returns:
        Tuple of (success: bool, error: Optional[str])
    """
    try:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        s3_client.download_file(
            AWS_S3_BUCKET_NAME,
            s3_key,
            file_path
        )
        return True, None
    
    except ClientError as e:
        if e.response['Error']['Code'] == '404':
            error_msg = f"File not found in S3: {s3_key}"
        else:
            error_msg = f"S3 download error: {e}"
        print(error_msg)
        return False, error_msg
    except Exception as e:
        error_msg = f"Unexpected error during download: {e}"
        print(error_msg)
        return False, error_msg


def get_file_from_s3_as_bytes(s3_key: str) -> Tuple[bool, Optional[bytes], Optional[str]]:
    """
    Retrieve file from S3 as bytes (without saving locally).
    
    Args:
        s3_key: S3 object key
    
    Returns:
        Tuple of (success: bool, file_bytes: Optional[bytes], error: Optional[str])
    """
    try:
        file_obj = io.BytesIO()
        s3_client.download_fileobj(
            AWS_S3_BUCKET_NAME,
            s3_key,
            file_obj
        )
        file_obj.seek(0)
        return True, file_obj.getvalue(), None
    
    except ClientError as e:
        if e.response['Error']['Code'] == '404':
            error_msg = f"File not found in S3: {s3_key}"
        else:
            error_msg = f"S3 download error: {e}"
        print(error_msg)
        return False, None, error_msg
    except Exception as e:
        error_msg = f"Unexpected error: {e}"
        print(error_msg)
        return False, None, error_msg


def delete_file_from_s3(s3_key: str) -> Tuple[bool, Optional[str]]:
    """
    Delete a file from S3.
    
    Args:
        s3_key: S3 object key
    
    Returns:
        Tuple of (success: bool, error: Optional[str])
    """
    try:
        s3_client.delete_object(
            Bucket=AWS_S3_BUCKET_NAME,
            Key=s3_key
        )
        return True, None
    
    except ClientError as e:
        error_msg = f"S3 delete error: {e}"
        print(error_msg)
        return False, error_msg
    except Exception as e:
        error_msg = f"Unexpected error during delete: {e}"
        print(error_msg)
        return False, error_msg


def list_files_in_s3(prefix: str = "") -> Tuple[bool, Optional[list], Optional[str]]:
    """
    List all files in S3 with given prefix.
    
    Args:
        prefix: Prefix path (e.g., "user_id/")
    
    Returns:
        Tuple of (success: bool, files: Optional[list], error: Optional[str])
    """
    try:
        response = s3_client.list_objects_v2(
            Bucket=AWS_S3_BUCKET_NAME,
            Prefix=prefix
        )
        
        files = []
        if 'Contents' in response:
            files = [obj['Key'] for obj in response['Contents']]
        
        return True, files, None
    
    except ClientError as e:
        error_msg = f"S3 list error: {e}"
        print(error_msg)
        return False, None, error_msg
    except Exception as e:
        error_msg = f"Unexpected error: {e}"
        print(error_msg)
        return False, None, error_msg


def generate_presigned_url(s3_key: str, expiration: int = 3600) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Generate a presigned URL for temporary access to S3 object.
    
    Args:
        s3_key: S3 object key
        expiration: URL expiration time in seconds (default: 1 hour)
    
    Returns:
        Tuple of (success: bool, url: Optional[str], error: Optional[str])
    """
    try:
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': AWS_S3_BUCKET_NAME, 'Key': s3_key},
            ExpiresIn=expiration
        )
        return True, url, None
    
    except ClientError as e:
        error_msg = f"Error generating presigned URL: {e}"
        print(error_msg)
        return False, None, error_msg
    except Exception as e:
        error_msg = f"Unexpected error: {e}"
        print(error_msg)
        return False, None, error_msg


def s3_file_exists(s3_key: str) -> bool:
    """
    Check if a file exists in S3.
    
    Args:
        s3_key: S3 object key
    
    Returns:
        True if file exists, False otherwise
    """
    try:
        s3_client.head_object(
            Bucket=AWS_S3_BUCKET_NAME,
            Key=s3_key
        )
        return True
    except ClientError as e:
        if e.response['Error']['Code'] == '404':
            return False
        print(f"Error checking file: {e}")
        return False
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False
