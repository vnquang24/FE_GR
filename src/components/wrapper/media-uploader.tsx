'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { Image, File, X, Upload, Loader2, MapPin, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { 
  useMinioControllerCreateUploadUrl, 
  useMinioControllerPresignedGetObject,
  fetchMinioControllerPresignedGetObject
} from '@/generated/api/chcnComponents';
import { useCreateMedia, useFindManyMedia } from '@/generated/hooks';
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
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('IMAGE');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaViewUrls, setMediaViewUrls] = useState<{[key: string]: string}>({});
  const [mediaItems, setMediaItems] = useState<MediaWithRelations[]>(initialMedia);

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
    setIsUncontrolledOpen(true);
    setPreviewUrl(null);
    setFile(null);
    setDescription('');
    // Reset custom coordinates
    setCustomCoordinates({
      lat: 0,
      lng: 0,
      useCustomCoordinates: false
    });
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
      console.log("Full presigned URL response:", presignedUrlResponse);      // Upload file to MinIO using the presigned URL
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
    //  const fileUrl = presignedUrlResponse.url.split('?')[0];
      
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
          // Đảm bảo coordinates tuân thủ cấu trúc CoordinateCreateNestedOneWithoutMediaInput
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
          description,
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
        // Tạo tọa độ mới từ thông tin người dùng nhập
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
        // Sử dụng tọa độ thảm họa mặc định
        createMediaData.data.coordinates = {
          connect: { id: disasterCoordinateId }
        };
      }
      
      // Gọi mutation để tạo media
      const createdMedia = await createMediaMutation.mutateAsync(createMediaData as any); // Sử dụng type assertion tạm thời
      
      toast.success({
        title: "Thành công",
        description: "Đã tải lên thành công"
      });
      
      // Close dialog and reset state - Fix: handle both controlled and uncontrolled state
      if (isControlled) {
        onUploadDialogOpenChange?.(false);
      } else {
        setIsUncontrolledOpen(false);
      }
      
      setFile(null);
      setPreviewUrl(null);
      setDescription('');
      setCustomCoordinates({
        lat: 0,
        lng: 0,
        useCustomCoordinates: false
      });
      // Add the new media to the list if it's returned
      if (createdMedia) {
        // Get a presigned URL for the new media
        const viewUrl = await getMediaViewUrl(uniqueFilename);
        setMediaViewUrls(prev => ({
          ...prev,
          [createdMedia.id]: viewUrl
        }));

        if (showGallery) {
          refetchMedia();
        }
        
      }
      
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
              <p className="text-sm line-clamp-2">{item.description || "Không có mô tả"}</p>
              <div className="mt-2 text-xs text-gray-500">
                <div className="flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  <span className="truncate">{item.user?.name || "Không xác định"}</span>
                </div>
                {item.coordinates && (
                  <div className="flex items-center mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span className="truncate">{item.coordinates.address || `${item.coordinates.lat.toFixed(6)}, ${item.coordinates.lng.toFixed(6)}`}</span>
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
                    Media này sẽ không có thông tin vị trí
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsUncontrolledOpen(false)}>
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

      {showGallery && (
        <div className="mt-4">
          <CardContent className="p-3">
            {renderMediaGallery()}
          </CardContent>
        </div>
      )}
    </>
  );
};

export default MediaUploader;