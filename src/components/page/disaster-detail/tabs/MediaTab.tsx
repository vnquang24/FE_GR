import React from 'react';
import { Image, Upload } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MediaUploader from '@/components/wrapper/media-uploader';

type MediaTabProps = {
  disaster: any;
  userID: string;
  showMediaUploadDialog: boolean;
  setShowMediaUploadDialog: (show: boolean) => void;
  handleMediaUploadSuccess: () => void;
};

const MediaTab: React.FC<MediaTabProps> = ({
  disaster,
  userID,
  showMediaUploadDialog,
  setShowMediaUploadDialog,
  handleMediaUploadSuccess
}) => {
  return (
    <Card className="shadow">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 py-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <Image className="h-5 w-5 text-blue-500 mr-2" />
            Hình ảnh & Media
          </CardTitle>
          <Button
            onClick={() => setShowMediaUploadDialog(true)}
            variant="outline"
            size="sm"
            className="flex items-center bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
          >
            <Upload className="h-4 w-4 mr-1" /> Tải lên hình ảnh/media
          </Button>
        </div>
      </CardHeader>
      {disaster ? (
        <MediaUploader
          disasterId={disaster.id}
          disasterCoordinateId={disaster.coordinate?.id}
          userId={userID || ''}
          showGallery={true}
          initialMedia={disaster?.media || []}
          onSuccess={handleMediaUploadSuccess}
          showUploadButton={false}
          isUploadDialogOpen={showMediaUploadDialog}
          onUploadDialogOpenChange={setShowMediaUploadDialog}
        />
      ) : null}
    </Card>
  );
};

export default MediaTab;