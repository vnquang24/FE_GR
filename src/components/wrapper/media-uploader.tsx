'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { Image, File as FileIcon, X, Upload, Loader2, MapPin, Users, Trash2, AlertTriangle, FilePlus, ImagePlus, Music4, VideoIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { 
  useMinioControllerCreateUploadUrl, 
  useMinioControllerPresignedGetObject,
  fetchMinioControllerPresignedGetObject
} from '@/generated/api/chcnComponents';
import { useCreateMedia, useFindManyMedia, useDeleteMedia } from '@/generated/hooks';
import { v4 as uuidv4 } from 'uuid';
// Thêm import cho các types từ Prisma
import type { Media, Coordinate, User, MediaType as PrismaMediaType } from '@prisma/client';
import { format } from 'date-fns';

// Định nghĩa kiểu dữ liệu MediaWithRelations kế thừa từ kiểu Media của Prisma
// và bao gồm các mối quan hệ cần thiết
interface MediaWithRelations extends Media {
  coordinates?: Coordinate;
  user?: User;
}

// Định nghĩa interface mới cho thông tin file
interface FileInfo {
  file: File;
  previewUrl: string;
  mediaType: MediaType;
  description: string;
}

interface MediaUploaderProps {
  disasterId: string;
  onSuccess?: () => void;
  disasterCoordinateId: string;
  userId: string;
  showGallery?: boolean;
  initialMedia?: MediaWithRelations[];
  showUploadButton?: boolean; // Thêm prop để kiểm soát hiển thị nút upload
  isUploadDialogOpen?: boolean; // Thêm prop để điều khiển trạng thái dialog từ bên ngoài
  onUploadDialogOpenChange?: (open: boolean) => void; // Callback khi trạng thái dialog thay đổi
}

// Sử dụng lại MediaType từ Prisma thay vì tự định nghĩa
type MediaType = PrismaMediaType;

const MediaUploader: React.FC<MediaUploaderProps> = ({
  disasterId,
  onSuccess,
  disasterCoordinateId,
  userId,
  showGallery = true,
  initialMedia = [],
  showUploadButton = true,
  isUploadDialogOpen = false,
  onUploadDialogOpenChange
}) => {
  // Instead of using local state, use the prop directly when it's provided
  const isControlled = onUploadDialogOpenChange !== undefined;
  const [isUncontrolledOpen, setIsUncontrolledOpen] = useState(false);
  const isOpen = isControlled ? isUploadDialogOpen : isUncontrolledOpen;
  
  // Thay thế state đơn lẻ bằng mảng các file
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [commonDescription, setCommonDescription] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaViewUrls, setMediaViewUrls] = useState<{[key: string]: string}>({});
  const [mediaItems, setMediaItems] = useState<MediaWithRelations[]>(initialMedia);

  // State for media deletion
  const [mediaToDelete, setMediaToDelete] = useState<MediaWithRelations | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Delete media mutation
  const deleteMediaMutation = useDeleteMedia({
    onSuccess: () => {
      toast.success({
        title: "Thành công",
        description: "Đã xóa media thành công"
      });
      // Refresh media list
      refetchMedia();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error({
        title: "Lỗi",
        description: `Không thể xóa media: ${error.message}`
      });
    }
  });

  // Thêm state cho coordinate
  const [customCoordinates, setCustomCoordinates] = useState({
    lat: 0,
    lng: 0,
    useCustomCoordinates: false
  });
  
  // MinIO hook for getting presigned upload URL
  const minioUploadUrlMutation = useMinioControllerCreateUploadUrl();

  // Import hook để lấy download URL
  // const minioDownloadUrlQuery = useMinioControllerPresignedGetObject({
  //   queryParams: { objectName: '' }
  // }, { enabled: false });
  
  // Hook to save media information to the database
  const createMediaMutation = useCreateMedia();

  // Fetch media if not provided via props
  const { data: mediaData, refetch: refetchMedia } = useFindManyMedia({
    where: {
      disasterId,
      deleted: null
    },
    include: {
      coordinates: true,
      user: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  }, {
    enabled: showGallery && initialMedia.length === 0
  });

  // Update media items when data changes
  useEffect(() => {
    if (mediaData && mediaData.length > 0) {
      // mediaData đã có kiểu MediaWithRelations[] vì đã include coordinates và user
      setMediaItems(mediaData);
    }
  }, [mediaData]);

  // Function to get presigned URLs for media viewing
  const getMediaViewUrl = async (objectName: string) => {
    try {
      // Extract the object name from the full URL if needed
      let path = objectName;
      
      if (objectName.includes('http')) {
        // If it's already a full URL, extract just the path part
        const url = new URL(objectName);
        path = url.pathname;
      }
      
      // Remove any leading slash if exists
      if (path.startsWith('/')) {
        path = path.substring(1);
      }
      
      // Sử dụng fetch function thay vì refetch
      const response = await fetchMinioControllerPresignedGetObject({
        queryParams: { objectName: path }
      });
      
      return response?.url || objectName;
    } catch (error) {
      console.error("Error getting presigned URL:", error);
      return objectName; // Fall back to original URL if error
    }
  };

  // Load presigned URLs for media items
  useEffect(() => {
    if (showGallery && mediaItems.length > 0) {
      const loadMediaUrls = async () => {
        const urlPromises = mediaItems.map(async (mediaItem) => {
          // Only get presigned URLs for items we don't already have
          if (!mediaViewUrls[mediaItem.id]) {
            const viewUrl = await getMediaViewUrl(mediaItem.url);
            return { id: mediaItem.id, url: viewUrl };
          }
          return null;
        });

        const results = await Promise.all(urlPromises);
        const newUrls = results.reduce((acc, item) => {
          if (item) {
            acc[item.id] = item.url;
          }
          return acc;
        }, {} as {[key: string]: string});

        setMediaViewUrls(prev => ({...prev, ...newUrls}));
      };

      loadMediaUrls();
    }
  }, [mediaItems]);

  // Hàm rút ngắn tên file dài
  const shortenFileName = (fileName: string, maxLength: number = 25) => {
    if (fileName.length <= maxLength) return fileName;
    
    const extension = fileName.split('.').pop() || '';
    const nameWithoutExt = fileName.substring(0, fileName.length - extension.length - 1);
    
    if (nameWithoutExt.length <= maxLength - 6) return fileName;
    
    const start = nameWithoutExt.substring(0, Math.floor((maxLength - 5) / 2));
    const end = nameWithoutExt.substring(nameWithoutExt.length - Math.ceil((maxLength - 5) / 2));
    
    return `${start}...${end}.${extension}`;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: FileInfo[] = Array.from(files).map((file) => {
      let mediaType: MediaType = 'IMAGE';
      if (file.type.startsWith('video/')) {
        mediaType = 'VIDEO';
      } else if (file.type.startsWith('audio/')) {
        mediaType = 'AUDIO';
      } else if (!file.type.startsWith('image/')) {
        toast.error({
          title: "Lỗi định dạng file",
          description: "Chỉ hỗ trợ file hình ảnh, video và âm thanh"
        });
        return null;
      }

      const previewUrl = URL.createObjectURL(file);
      return { file, previewUrl, mediaType, description: '' };
    }).filter(Boolean) as FileInfo[];

    setSelectedFiles((prev) => [...prev, ...newFiles]);

    return () => {
      newFiles.forEach((file) => URL.revokeObjectURL(file.previewUrl));
    };
  };

  const handleOpenDialog = () => {
    setIsUncontrolledOpen(true);
    setSelectedFiles([]);
    setCommonDescription('');
    // Reset custom coordinates
    setCustomCoordinates({
      lat: 0,
      lng: 0,
      useCustomCoordinates: false
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error({
        title: "Lỗi",
        description: "Vui lòng chọn file để tải lên"
      });
      return;
    }

    try {
      setIsUploading(true);
      let successCount = 0;

      for (const fileInfo of selectedFiles) {
        const { file, mediaType, description } = fileInfo;

        // Generate a unique filename using date format and UUID
        const fileExtension = file.name.split('.').pop();
        const today = format(new Date(), 'yyyy-MM-dd');
        const uniqueFilename = `media/${today}/${uuidv4()}.${fileExtension}`;
        console.log("Unique filename:", uniqueFilename);

        // Get presigned URL for upload from MinIO service
        const presignedUrlResponse = await minioUploadUrlMutation.mutateAsync({
          body: {
            path: uniqueFilename
          }
        });

        if (!presignedUrlResponse?.url) {
          throw new Error("Không thể tạo URL tải lên");
        }
        console.log("Full presigned URL response:", presignedUrlResponse);

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

        // Save media information to the database using createMedia hook
        const createMediaData: {
          data: {
            url: string;
            description: string;
            mediaType: MediaType;
            disaster: {
              connect: { id: string };
            };
            user: {
              connect: { id: string };
            };
            coordinates?: {
              connect?: { id: string };
              create?: {
                lat: number;
                lng: number;
                disaster: {
                  connect: { id: string };
                };
              };
            };
          },
          include: {
            coordinates: boolean;
            user: boolean;
          }
        } = {
          data: {
            url: uniqueFilename,
            description: description || commonDescription,
            mediaType,
            disaster: {
              connect: { id: disasterId }
            },
            user: {
              connect: { id: userId }
            }
          },
          include: {
            coordinates: true,
            user: true
          }
        };

        // Sử dụng disasterCoordinateId mặc định hoặc custom coordinates nếu người dùng chọn
        if (customCoordinates.useCustomCoordinates) {
          createMediaData.data.coordinates = {
            create: {
              lat: customCoordinates.lat,
              lng: customCoordinates.lng,
              disaster: {
                connect: { id: disasterId }
              }
            }
          };
        } else if (disasterCoordinateId) {
          createMediaData.data.coordinates = {
            connect: { id: disasterCoordinateId }
          };
        }

        try {
          // Gọi mutation để tạo media
          const createdMedia = await createMediaMutation.mutateAsync(createMediaData as any);

          // Get a presigned URL for the new media
          if (createdMedia) {
            const viewUrl = await getMediaViewUrl(uniqueFilename);
            setMediaViewUrls(prev => ({
              ...prev,
              [createdMedia.id]: viewUrl
            }));
            
            successCount++;
          }
        } catch (mediaError) {
          console.error("Error creating media record:", mediaError);
          // Continue with other files even if one fails
        }
      }

      // Refresh media gallery if we successfully uploaded any files
      if (successCount > 0 && showGallery) {
        refetchMedia();
      }

      toast.success({
        title: "Tải lên thành công",
        description: `Đã tải lên ${successCount} / ${selectedFiles.length} file`
      });

      // Close dialog and reset state - Fix: handle both controlled and uncontrolled state
      if (isControlled) {
        onUploadDialogOpenChange?.(false);
      } else {
        setIsUncontrolledOpen(false);
      }

      setSelectedFiles([]);
      setCommonDescription('');
      setCustomCoordinates({
        lat: 0,
        lng: 0,
        useCustomCoordinates: false
      });

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

  const handleClearFile = (index: number) => {
    setSelectedFiles((prev) => {
      const updatedFiles = [...prev];
      const [removedFile] = updatedFiles.splice(index, 1);
      URL.revokeObjectURL(removedFile.previewUrl);
      return updatedFiles;
    });
  };

  // Render the media gallery
  const renderMediaGallery = () => {
    if (!showGallery) return null;

    if (mediaItems.length === 0) {
      return (
        <div className="text-center py-8 bg-gray-50 rounded-md">
          <Image className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">Không có hình ảnh hoặc media</p>
          <p className="text-sm text-gray-400 mb-4">Chưa có hình ảnh hoặc media nào được đăng tải.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {mediaItems.map((item) => (
          <div key={item.id} className="border rounded-md overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="aspect-video bg-gray-100 relative">
              {item.mediaType === 'IMAGE' ? (
                mediaViewUrls[item.id] ? (
                  <a 
                    href={mediaViewUrls[item.id]} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full h-full"
                  >
                    <img
                      src={mediaViewUrls[item.id]}
                      alt={item.description || 'Hình ảnh'}
                      className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                      onError={(e) => {
                        // Set placeholder when image fails to load
                        e.currentTarget.src = 'https://placehold.co/400x300?text=Không+thể+tải+ảnh';
                        e.currentTarget.className = 'w-full h-full object-contain';
                      }}
                    />
                  </a>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                  </div>
                )
              ) : item.mediaType === 'VIDEO' ? (
                mediaViewUrls[item.id] ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    <video
                      src={mediaViewUrls[item.id]}
                      controls
                      className="max-h-full max-w-full"
                      onError={(e) => {
                        // Display error message when video fails to load
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="flex items-center justify-center w-full h-full text-white text-sm">Không thể tải video</div>';
                        }
                      }}
                    ></video>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                  </div>
                )
              ) : (
                mediaViewUrls[item.id] ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <audio
                      src={mediaViewUrls[item.id]}
                      controls
                      className="w-4/5"
                      onError={(e) => {
                        // Display error message when audio fails to load
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="flex items-center justify-center w-full h-full text-gray-500 text-sm">Không thể tải âm thanh</div>';
                        }
                      }}
                    ></audio>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                  </div>
                )
              )}
              
              {/* Add delete button overlay in top right corner */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-7 w-7 rounded-full bg-black/40 text-white hover:bg-black/60"
                onClick={() => handleDeleteRequest(item)}
                title="Xóa media"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="p-3">
              <div className="flex justify-between items-center mb-1">
                <div className="text-xs text-gray-500">
                  {item.mediaType === 'IMAGE' ? 'Hình ảnh' : item.mediaType === 'VIDEO' ? 'Video' : 'Âm thanh'}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                </div>
              </div>
              <p className="text-sm line-clamp-2 break-words" title={item.description || "Không có mô tả"}>
                {item.description || "Không có mô tả"}
              </p>
              <div className="mt-2 text-xs text-gray-500">
                <div className="flex items-center">
                  <Users className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate" title={item.user?.name || "Không xác định"}>
                    {item.user?.name || "Không xác định"}
                  </span>
                </div>
                {item.coordinates && (
                  <div className="flex items-center mt-1">
                    <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate" title={item.coordinates.address || `${item.coordinates.lat.toFixed(6)}, ${item.coordinates.lng.toFixed(6)}`}>
                      {item.coordinates.address || `${item.coordinates.lat.toFixed(6)}, ${item.coordinates.lng.toFixed(6)}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    setIsUncontrolledOpen(isUploadDialogOpen);
  }, [isUploadDialogOpen]);

  const handleDialogChange = (open: boolean) => {
    if (isControlled) {
      onUploadDialogOpenChange?.(open);
    } else {
      setIsUncontrolledOpen(open);
    }
  };

  // Handle opening delete confirmation dialog
  const handleDeleteRequest = (media: MediaWithRelations) => {
    setMediaToDelete(media);
    setShowDeleteConfirmation(true);
  };

  // Handle delete media confirmation
  const handleDeleteMedia = async () => {
    if (!mediaToDelete) return;

    try {
      setIsDeleting(true);
      
      // Mark the media as deleted (soft delete by setting deleted timestamp)
      await deleteMediaMutation.mutateAsync({
        where: { id: mediaToDelete.id },
      });

      // Close the confirmation dialog
      setShowDeleteConfirmation(false);
      setMediaToDelete(null);
      
    } catch (error) {
      console.error("Error deleting media:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle closing the confirmation dialog
  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
    setMediaToDelete(null);
  };

  return (
    <>
      {showUploadButton && (
        <Button 
          onClick={handleOpenDialog}
          variant="outline" 
          size="sm"
          className="flex items-center bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
        >
          <Upload className="h-4 w-4 mr-1" /> Tải lên hình ảnh/media
        </Button>
      )}
      
      <Dialog open={isOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Tải lên hình ảnh hoặc media</DialogTitle>
            <DialogDescription>
              Tải lên hình ảnh, video, hoặc âm thanh liên quan đến thảm họa. Bạn có thể chọn nhiều file cùng lúc.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="file">Chọn file</Label>
                {selectedFiles.length > 0 && (
                  <span className="text-xs text-blue-600 font-medium">
                    Đã chọn {selectedFiles.length} file
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Card className="overflow-hidden p-2 bg-gray-50 border-dashed">
                  <div className="flex flex-col items-center justify-center py-4">
                    <FilePlus className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-700 mb-1">Kéo và thả file vào đây hoặc</p>
                    <Label
                      htmlFor="file"
                      className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 text-xs rounded-md font-medium"
                    >
                      Chọn file
                    </Label>
                    <Input
                      id="file"
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*,video/*,audio/*"
                      multiple
                      className="sr-only"
                    />
                    <p className="text-xs text-gray-500 mt-2">Hỗ trợ: JPG, PNG, GIF, MP4, MP3,...</p>
                  </div>
                </Card>
              </div>
            </div>
            
            {selectedFiles.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">File đã chọn</h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedFiles([])}
                    className="h-8 text-xs text-red-500 hover:text-red-600"
                  >
                    Xóa tất cả
                  </Button>
                </div>
                <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                  {selectedFiles.map((fileInfo, index) => (
                    <Card key={index} className="overflow-hidden">
                      <div className="flex items-center p-2">
                        <div className="h-12 w-12 mr-3 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {fileInfo.mediaType === 'IMAGE' && (
                            <img 
                              src={fileInfo.previewUrl} 
                              alt="Preview" 
                              className="h-full w-full object-cover"
                            />
                          )}
                          {fileInfo.mediaType === 'VIDEO' && (
                            <VideoIcon className="h-6 w-6 text-gray-500" />
                          )}
                          {fileInfo.mediaType === 'AUDIO' && (
                            <Music4 className="h-6 w-6 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 mr-2 overflow-hidden">
                          <div 
                            className="text-sm font-medium text-gray-900 truncate w-full" 
                            title={fileInfo.file.name}
                            style={{ maxWidth: 'calc(100% - 10px)' }}
                          >
                            {shortenFileName(fileInfo.file.name)}
                          </div>
                          <p className="text-xs text-gray-500">
                            {(fileInfo.file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0 ml-auto"
                          onClick={() => handleClearFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả chung</Label>
              <Textarea
                id="description"
                value={commonDescription}
                onChange={(e) => setCommonDescription(e.target.value)}
                placeholder="Nhập mô tả chung cho các file media này"
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coordinates" className="flex items-center">
                <MapPin className="h-4 w-4 mr-1 text-gray-600" /> 
                Vị trí tọa độ
              </Label>
              <div className="rounded-md border border-gray-200 p-3 bg-gray-50">
                <div className="flex items-center mb-2">
                  <input
                    id="useCustomCoordinates"
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={customCoordinates.useCustomCoordinates}
                    onChange={(e) => setCustomCoordinates(prev => ({ ...prev, useCustomCoordinates: e.target.checked }))}
                  />
                  <Label htmlFor="useCustomCoordinates" className="ml-2 text-sm font-medium">
                    Sử dụng tọa độ tùy chỉnh
                  </Label>
                </div>
                
                {!customCoordinates.useCustomCoordinates && disasterCoordinateId ? (
                  <p className="text-sm text-gray-600 italic">
                    Sẽ sử dụng tọa độ mặc định của thảm họa
                  </p>
                ) : customCoordinates.useCustomCoordinates ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="lat" className="text-xs text-gray-500 mb-1 block">Vĩ độ (latitude):</Label>
                      <Input
                        id="lat"
                        type="number"
                        step="0.000001"
                        value={customCoordinates.lat.toString()}
                        onChange={(e) => setCustomCoordinates(prev => ({ 
                          ...prev, 
                          lat: e.target.value === "" ? 0 : parseFloat(e.target.value) 
                        }))}
                        placeholder="Ví dụ: 10.762622"
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lng" className="text-xs text-gray-500 mb-1 block">Kinh độ (longitude):</Label>
                      <Input
                        id="lng"
                        type="number"
                        step="0.000001"
                        value={customCoordinates.lng.toString()}
                        onChange={(e) => setCustomCoordinates(prev => ({ 
                          ...prev, 
                          lng: e.target.value === "" ? 0 : parseFloat(e.target.value) 
                        }))}
                        placeholder="Ví dụ: 106.660172"
                        className="bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-yellow-600 italic">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    Media này sẽ không có thông tin vị trí
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter className="mt-4">
            <Button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || isUploading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tải {selectedFiles.length > 1 ? `${selectedFiles.length} file` : 'file'} lên...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Tải {selectedFiles.length > 0 ? `${selectedFiles.length} file` : 'file'} lên
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showGallery && (
        <div className="mt-4">
          <CardContent className="p-3">
            {renderMediaGallery()}
          </CardContent>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Xác nhận xóa
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa {mediaToDelete?.mediaType === 'IMAGE' ? 'hình ảnh' : mediaToDelete?.mediaType === 'VIDEO' ? 'video' : 'âm thanh'} này không?
              Thao tác này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          
          {mediaToDelete && mediaToDelete.mediaType === 'IMAGE' && mediaViewUrls[mediaToDelete.id] && (
            <div className="p-2 bg-gray-100 rounded-md my-4 flex justify-center">
              <img 
                src={mediaViewUrls[mediaToDelete.id]} 
                alt="Media to delete" 
                className="max-h-40 object-contain"
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/400x300?text=Không+thể+tải+ảnh';
                }}
              />
            </div>
          )}
          
          <div className="pt-4 pb-2">
            <p className="text-sm text-gray-600 mb-1">
              <strong>Mô tả:</strong> {mediaToDelete?.description || "Không có mô tả"}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Ngày tạo:</strong> {mediaToDelete ? new Date(mediaToDelete.createdAt).toLocaleDateString('vi-VN') : ""}
            </p>
          </div>
          
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              disabled={isDeleting}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMedia}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa
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