# apps/api/app/services/storage.py
import os
import boto3
from botocore.config import Config

class StorageService:
    def __init__(self):
        self.account_id = os.getenv("R2_ACCOUNT_ID")
        self.access_key = os.getenv("R2_ACCESS_KEY_ID")
        self.secret_key = os.getenv("R2_SECRET_ACCESS_KEY")
        self.bucket_name = os.getenv("R2_BUCKET_NAME")

        if not all([self.account_id, self.access_key, self.secret_key, self.bucket_name]):
            print("Warning: R2 credentials missing. Uploads will fail.")
            self.s3 = None
            return

        self.s3 = boto3.client(
            "s3",
            endpoint_url=f"https://{self.account_id}.r2.cloudflarestorage.com",
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            config=Config(signature_version="s3v4"),
        )

    def generate_presigned_url(self, file_name: str, content_type: str) -> dict:
        if not self.s3:
            raise Exception("Storage service not configured")

        try:
            # Generate unique key to prevent overwrites
            import uuid
            ext = file_name.split(".")[-1] if "." in file_name else "jpg"
            object_key = f"catches/{uuid.uuid4().hex}.{ext}"

            # Generate the URL
            url = self.s3.generate_presigned_url(
                "put_object",
                Params={
                    "Bucket": self.bucket_name,
                    "Key": object_key,
                    "ContentType": content_type,
                },
                ExpiresIn=3600,
            )

            # Return the URL to upload TO, and the final URL to read FROM
            # Note: You might need a custom domain or public R2 dev URL for 'public_url'
            # For now, we assume you enabled "R2.dev subdomain" or custom domain
            # If standard R2.dev: https://pub-<hash>.r2.dev/<key>
            
            # TODO: Set PUBLIC_ASSET_URL in env once you enable public access on bucket
            public_domain = "https://pub-38aebb6da3bb4165b25bbe7fe18cec25.r2.dev" 
            
            # If you want to keep using env vars later, use this instead:
            # public_domain = os.getenv("R2_PUBLIC_DOMAIN", "https://photos.bassclarity.com")
            
            final_url = f"{public_domain}/{object_key}"

            return {"upload_url": url, "public_url": final_url, "key": object_key}

        except Exception as e:
            print(f"Error generating presigned URL: {e}")
            return None