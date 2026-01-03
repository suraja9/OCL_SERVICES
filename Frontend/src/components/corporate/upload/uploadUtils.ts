// Upload utility functions for corporate booking
import { compressAndConvertToWebP } from '@/utils/imageCompression';

export interface UploadedFileData {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimetype: string;
  url: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  files: UploadedFileData[];
}

// Upload files to the server
export const uploadFiles = async (files: File[]): Promise<UploadResponse> => {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append('packageImages', file);
  });

  try {
    const response = await fetch('/api/upload/package-images', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Upload failed');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(error instanceof Error ? error.message : 'Upload failed');
  }
};

// Validate file before upload
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  // Check file type
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'application/pdf'
  ];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only images (JPEG, PNG, WEBP) and PDF files are allowed' };
  }

  return { valid: true };
};

// Compress image file and convert to WebP
export const compressImage = async (file: File, quality: number = 0.85): Promise<File> => {
  // If not an image, return as is
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // Use the shared compression utility
  return compressAndConvertToWebP(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    quality
  });
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get file icon based on type
export const getFileIcon = (file: File): string => {
  if (file.type.startsWith('image/')) {
    return 'image';
  } else if (file.type === 'application/pdf') {
    return 'pdf';
  }
  return 'file';
};
