import { SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';

// Type định nghĩa cho data fields
export type DataFieldNode = {
  id: string;
  name: string;
  code?: string;
  unit?: string;
  parentId?: string;
  dataFieldGroup?: string;
  $optimistic?: boolean;
  [key: string]: string | boolean | undefined;
};

interface HierarchicalSelectProps {
  dataFields: DataFieldNode[];
  existingFieldIds?: string[];
  renderItem?: (node: DataFieldNode, level: number, hasNodeChildren: boolean, isExpanded: boolean) => React.ReactNode;
  emptyMessage?: string;
  rootGroupLabel?: string;
  className?: string;
  /**
   * Callback khi một node được chọn
   * Nếu không cung cấp, sẽ sử dụng hành vi mặc định
   */
  onSelectNode?: (nodeId: string) => void;
  /**
   * Hàm lọc để giới hạn các node hiển thị
   * Trả về true nếu node nên được hiển thị
   */
  filterFunction?: (node: DataFieldNode) => boolean;
}

const HierarchicalSelect: React.FC<HierarchicalSelectProps> = ({
  dataFields = [],
  existingFieldIds = [],
  renderItem,
  emptyMessage = 'Không có trường dữ liệu khả dụng',
  rootGroupLabel = 'Trường dữ liệu cấp 1',
  className,
  onSelectNode,
  filterFunction
}) => {
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);

  // Tách các logic utility để làm việc với cây phân cấp
  const getAvailableDataFields = () => {
    if (!dataFields) return [];
    
    // Lọc các trường đã tồn tại
    let filteredFields = dataFields.filter((field) => !existingFieldIds.includes(field.id));
    
    // Áp dụng hàm filter tùy chỉnh nếu được cung cấp
    if (filterFunction) {
      filteredFields = filteredFields.filter(filterFunction);
    }
    
    return filteredFields;
  };

  // Hàm chuyển đổi danh sách dataField phẳng thành cấu trúc cây
  const convertDataFieldsToTree = () => {
    const availableFields = getAvailableDataFields();
    if (!availableFields.length) return { rootNodes: [], allNodes: [], childrenMap: {} };
    
    // Tạo map lưu trữ các node con cho mỗi node cha
    const childrenMap: Record<string, string[]> = {};
    
    // Khởi tạo map rỗng cho tất cả các node
    availableFields.forEach((field) => {
      childrenMap[field.id] = [];
    });
    
    // Điền các node con vào map
    availableFields.forEach((field) => {
      if (field.parentId && childrenMap[field.parentId]) {
        childrenMap[field.parentId].push(field.id);
      }
    });
    
    // Lấy các node gốc (không có parent hoặc parentId rỗng)
    const rootNodes = availableFields.filter((field) => 
      !field.parentId || field.parentId === '' || field.parentId === '0'
    );
    
    return { rootNodes, allNodes: availableFields, childrenMap };
  };
  
  // Lấy các node con cho một node cha
  const getChildNodes = (parentId: string) => {
    const { allNodes, childrenMap } = convertDataFieldsToTree();
    const childIds = childrenMap?.[parentId] || [];
    return allNodes.filter((node) => childIds.includes(node.id));
  };
  
  // Kiểm tra xem một node có node con không
  const hasChildren = (nodeId: string) => {
    const { childrenMap } = convertDataFieldsToTree();
    return (childrenMap?.[nodeId]?.length || 0) > 0;
  };
  
  // Toggle mở rộng/thu gọn cho một node
  const toggleNodeExpansion = (nodeId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setExpandedNodes((prev: string[]) => 
      prev.includes(nodeId)
        ? prev.filter((id: string) => id !== nodeId)
        : [...prev, nodeId]
    );
  };

  // Xử lý sự kiện khi một node được chọn
  const handleNodeSelect = (nodeId: string, e?: React.MouseEvent) => {
    // Ngăn chặn sự kiện mặc định và bubbling nếu e tồn tại
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Gọi callback onSelectNode nếu được cung cấp
    if (onSelectNode) {
      // Gọi callback với nodeId được chọn (kể cả node con)
      onSelectNode(nodeId);
      
      // Tìm node được chọn từ danh sách
      const selectedNode = dataFields.find(field => field.id === nodeId);
      
      if (selectedNode && selectedNode.parentId) {
        // Nếu node có parent, mở rộng đường dẫn đến parent
        let currentParentId = selectedNode.parentId;
        const parentsToExpand = [currentParentId];
        
        // Lặp qua các cấp parent để mở rộng
        while (currentParentId) {
          const parentNode = dataFields.find(field => field.id === currentParentId);
          if (parentNode && parentNode.parentId) {
            parentsToExpand.push(parentNode.parentId);
            currentParentId = parentNode.parentId;
          } else {
            break;
          }
        }
        
        // Cập nhật trạng thái các node đã mở rộng
        setExpandedNodes(prev => {
          // Chỉ thêm các parent chưa được mở rộng
          const newExpanded = [...prev];
          parentsToExpand.forEach(id => {
            if (!newExpanded.includes(id)) {
              newExpanded.push(id);
            }
          });
          return newExpanded;
        });
      }
    }
  };

  // Render default select item nếu không có renderItem được cung cấp
  const defaultRenderItem = (node: DataFieldNode, level: number, hasNodeChildren: boolean, isExpanded: boolean) => {
    const padding = level * 12; // Tăng mức thụt đầu dòng theo cấp độ
    
    return (
      <div className="flex items-center w-full hover:bg-blue-50 relative">
        <SelectItem 
          value={node.id}
          className="flex-1 bg-white hover:bg-transparent"
          style={{ paddingLeft: `${16 + padding}px`, paddingRight: hasNodeChildren ? "2.5rem" : "1rem" }}
          onClick={(e) => {
            // Đánh dấu sự kiện là đã xử lý để tránh bubbling
            e.stopPropagation();
            // Gọi handleNodeSelect với node hiện tại
            handleNodeSelect(node.id, e);
          }}
        >
          {node.name} {node.unit ? `(${node.unit})` : ''} 
        </SelectItem>
        
        {hasNodeChildren && (
          <div
            onClick={(e) => toggleNodeExpansion(node.id, e)}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full cursor-pointer z-10"
          >
            {isExpanded ? '−' : '+'}
          </div>
        )}
      </div>
    );
  };
  
  // Render các SelectItem dạng cây phân cấp
  const renderTree = () => {
    const { rootNodes } = convertDataFieldsToTree();
    
    const renderNode = (node: DataFieldNode, level = 0) => {
      const children = getChildNodes(node.id);
      const hasNodeChildren = hasChildren(node.id);
      const isExpanded = expandedNodes.includes(node.id);
      
      return (
        <React.Fragment key={node.id}>
          {renderItem 
            ? renderItem(node, level, hasNodeChildren, isExpanded) 
            : defaultRenderItem(node, level, hasNodeChildren, isExpanded)}
          
          {hasNodeChildren && isExpanded && (
            <div className="node-children">
              {children.map((child) => renderNode(child, level + 1))}
            </div>
          )}
        </React.Fragment>
      );
    };
    
    return (
      <div className={cn("hierarchical-select", className)} onClick={(e) => e.stopPropagation()}>
        {rootNodes.length > 0 && (
          <div className="px-2 py-1 text-xs text-gray-500 font-semibold">Số lượng trường dữ liệu: {rootNodes.length}</div>
        )}
        
        {rootNodes.map((node) => renderNode(node))}
        
        {rootNodes.length === 0 && (
          <div className="px-2 py-4 text-center text-gray-500">
            {emptyMessage}
          </div>
        )}
      </div>
    );
  };

  return renderTree();
};

export default HierarchicalSelect;