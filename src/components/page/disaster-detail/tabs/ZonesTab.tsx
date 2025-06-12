import React from 'react';
import { Map, Plus, Globe } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TableWrapper, TableRow, TableCell } from '@/components/ui/table';
import Link from 'next/link';

type Zone = {
  id: string;
  name: string;
  description?: string;
  boundary: any;
};

type ZonesTabProps = {
  zones: Zone[];
  onNavigateToZoneManagement: () => void;
};

const ZonesTab: React.FC<ZonesTabProps> = ({
  zones,
  onNavigateToZoneManagement
}) => {
  return (
    <Card className="shadow">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-indigo-50 py-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <Map className="h-5 w-5 text-indigo-500 mr-2" />
            Khu vực & Vùng ảnh hưởng
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <TableWrapper
          variant="border"
          spacing="md"
          columns={[
            {
              header: "Tên khu vực",
              accessorKey: "name",
              className: "w-[30%]",
              cell: (item) => <span className="font-medium">{item.name}</span>
            },
            {
              header: "Mô tả",
              accessorKey: "description",
              className: "w-[50%]",
              cell: (item) => <span className="text-gray-500">{item.description || "Không có mô tả"}</span>
            },
            {
              header: "Thao tác",
              cell: (item) => (
                <div className="text-center">
                  <Link
                    href={`/operation/zone/${item.id}`}
                    className="text-blue-500 hover:text-blue-700 text-sm inline-flex items-center"
                  >
                    <Globe className="h-3.5 w-3.5 mr-1" /> Xem khu vực
                  </Link>
                </div>
              ),
              className: "text-center"
            }
          ]}
          data={zones}
          emptyState={
            <TableRow>
              <TableCell colSpan={3} className="p-0 items-center">
                <div className="text-center py-8 bg-gray-50 rounded-md">
                  <Map className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">Không có khu vực bị ảnh hưởng</p>
                  <p className="text-sm text-gray-400 mb-4">Thảm họa này chưa có thông tin về khu vực hoặc vùng bị ảnh hưởng</p>
                  <Button
                    variant="outline"
                    className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-200"
                    onClick={onNavigateToZoneManagement}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Quản lý khu vực
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          }
        />
      </CardContent>
    </Card>
  );
};

export default ZonesTab; 