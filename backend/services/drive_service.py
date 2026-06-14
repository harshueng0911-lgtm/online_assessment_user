import os
import io
import json

from dotenv import load_dotenv
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from google.oauth2 import service_account

# Load .env locally
load_dotenv()

SCOPES = ['https://www.googleapis.com/auth/drive.readonly']


def get_drive_service():
    try:
        credentials_json = os.getenv("GOOGLE_CREDENTIALS_JSON")

        if not credentials_json:
            raise Exception("GOOGLE_CREDENTIALS_JSON not found")

        creds = service_account.Credentials.from_service_account_info(
            json.loads(credentials_json),
            scopes=SCOPES
        )

        print("===== DRIVE DEBUG =====")
        print("Service Account:", creds.service_account_email)

        return build("drive", "v3", credentials=creds)

    except Exception as e:
        print("❌ DRIVE AUTH ERROR:", e)
        raise


def download_excel(file_id):
    try:
        service = get_drive_service()

        # Get file metadata
        file = service.files().get(
            fileId=file_id,
            fields="mimeType,name"
        ).execute()

        mime_type = file.get("mimeType")
        file_name = file.get("name")

        print("📄 File Name:", file_name)
        print("📄 File MIME:", mime_type)

        # Handle Google Sheets export
        if mime_type == "application/vnd.google-apps.spreadsheet":
            request = service.files().export_media(
                fileId=file_id,
                mimeType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
        else:
            request = service.files().get_media(fileId=file_id)

        # Download file
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)

        done = False
        while not done:
            status, done = downloader.next_chunk()

            if status:
                print(
                    f"⬇️ Download Progress: "
                    f"{int(status.progress() * 100)}%"
                )

        fh.seek(0)

        print("✅ Download successful")
        print("📦 Size:", len(fh.getvalue()), "bytes")

        return fh

    except Exception as e:
        print("❌ DOWNLOAD ERROR:", e)
        raise