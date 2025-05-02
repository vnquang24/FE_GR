'use client';
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { Image, File, X, Upload, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useMinioControllerCreateUploadUrl } from '@/generated/api/chcnComponents';
import { useCreateMedia } from '@/generated/hooks';
import { v4 as uuidv4 } from 'uuid';

interface MediaUploaderProps {
  disasterId: string;
  onSuccess?: () => void;
  disasterCoordinateId: string; // Đã chuyển thành required, không có dấu ?
  userId: string; // Đã chuyển thành required, không có dấu ?
}

type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO';

const MediaUploader: React.FC<MediaUploaderProps> = ({
  disasterId,
  onSuccess,
  disasterCoordinateId,
  userId
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('IMAGE');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // MinIO hook for getting presigned upload URL
  const minioUploadUrlMutation = useMinioControllerCreateUploadUrl();
  
  // Hook to save media information to the database
  const createMediaMutation = useCreateMedia();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    
    // Determine media type based on file MIME type
    if (selectedFile.type.startsWith('image/')) {
      setMediaType('IMAGE');
    } else if (selectedFile.type.startsWith('video/')) {
      setMediaType('VIDEO');
    } else if (selectedFile.type.startsWith('audio/')) {
      setMediaType('AUDIO');
    } else {
      toast.error({
        title: "Lỗi định dạng file",
        description: "Chỉ hỗ trợ file hình ảnh, video và âm thanh"
      });
      return;
    }
    
    // Create a preview URL for the file
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    setFile(selectedFile);
    
    return () => URL.revokeObjectURL(objectUrl);
  };
  
  const handleOpenDialog = () => {
    setIsOpen(true);
    setPreviewUrl(null);
    setFile(null);
    setDescription('');
  };
  
  const handleUpload = async () => {
    if (!file) {
      toast.error({
        title: "Lỗi",
        description: "Vui lòng chọn file để tải lên"
      });
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Generate a unique filename using UUID
      const fileExtension = file.name.split('.').pop();
      const uniqueFilename = `${disasterId}/${uuidv4()}.${fileExtension}`;
      
      // Get presigned URL for upload from MinIO service
      const presignedUrlResponse = await minioUploadUrlMutation.mutateAsync({
        body: {
          path: uniqueFilename
        }
      });
      
      if (!presignedUrlResponse?.url) {
        throw new Error("Không thể tạo URL tải lên");
      }
      
      // Upload file to MinIO using the presigned URL
      const uploadResponse = await fetch(presignedUrlResponse.url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Lỗi khi tải lên: ${uploadResponse.statusText}`);
      }
      
      // Extract the base URL from the presigned URL (remove query params)
      const fileUrl = presignedUrlResponse.url.split('?')[0];
      
      // Save media information to the database using createMedia hook
      await createMediaMutation.mutateAsync({
        data: {
          url: fileUrl,
          description,
          mediaType,
          disaster: {
            connect: { id: disasterId }
          },
          coordinates: {
            connect: { id: disasterCoordinateId }
          },
          user: {
            connect: { id: userId }
          }
        }
      });
      
      toast.success({
        title: "Thành công",
        description: "Đã tải lên thành công"
      });
      
      // Close dialog and reset state
      setIsOpen(false);
      setFile(null);
      setPreviewUrl(null);
      setDescription('');
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error({
        title: "Lỗi tải lên",
        description: error.message || "Đã xảy ra lỗi khi tải file lên"
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleClearFile = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Button 
        onClick={handleOpenDialog}
        variant="outline" 
        size="sm"
        className="flex items-center bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
      >
        <Upload className="h-4 w-4 mr-1" /> Tải lên hình ảnh/media
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Tải lên hình ảnh hoặc media</DialogTitle>
            <DialogDescription>
              Tải lên hình ảnh, video, hoặc âm thanh liên quan đến thảm họa.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,video/*,audio/*"
                  className="bg-white flex-1"
                />
                {previewUrl && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={handleClearFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {previewUrl && file && (
              <Card className="overflow-hidden p-2">
                {mediaType === 'IMAGE' && (
                  <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}
                {mediaType === 'VIDEO' && (
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <video 
                      src={previewUrl}
                      controls
                      className="max-h-full max-w-full"
                    ></video>
                  </div>
                )}
                {mediaType === 'AUDIO' && (
                  <div className="p-4 bg-gray-100 flex items-center justify-center">
                    <audio 
                      src={previewUrl}
                      controls
                      className="w-full"
                    ></audio>
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </div>
              </Card>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả cho file media này"
                className="bg-white"
              />
            </div>
          </div>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tải lên...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Tải lên
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MediaUploader;