import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Table, Spin } from 'antd';
import styled from 'styled-components';
import { useVirtualization } from '../../hooks/useMemoization';

const VirtualizedContainer = styled.div`
  height: ${props => props.height || '400px'};
  overflow-y: auto;
  position: relative;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
    
    &:hover {
      background: #a8a8a8;
    }
  }
`;

const VirtualizedTable = ({
  dataSource = [],
  columns = [],
  rowHeight = 54,
  containerHeight = 400,
  loading = false,
  pagination = false,
  scroll = {},
  ...tableProps
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // 가상화 계산
  const virtualization = useVirtualization(
    dataSource,
    rowHeight,
    containerHeight,
    scrollTop
  );

  // 스크롤 핸들러
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  // 가상화된 데이터
  const virtualizedDataSource = useMemo(() => {
    return virtualization.visibleItems.map((item, index) => ({
      ...item,
      key: item.key || item.id || virtualization.startIndex + index,
      _virtualIndex: virtualization.startIndex + index
    }));
  }, [virtualization]);

  // 가상화된 컬럼 (스타일 적용)
  const virtualizedColumns = useMemo(() => {
    return columns.map(column => ({
      ...column,
      render: (text, record, index) => {
        const originalRender = column.render;
        if (originalRender) {
          return originalRender(text, record, index);
        }
        return text;
      }
    }));
  }, [columns]);

  // 스크롤 설정
  const virtualizedScroll = useMemo(() => ({
    ...scroll,
    y: virtualization.totalHeight,
    x: scroll.x || '100%'
  }), [scroll, virtualization.totalHeight]);

  return (
    <VirtualizedContainer
      ref={containerRef}
      height={containerHeight}
      onScroll={handleScroll}
    >
      <div style={{ height: virtualization.totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${virtualization.offsetY}px)` }}>
          <Table
            dataSource={virtualizedDataSource}
            columns={virtualizedColumns}
            pagination={pagination}
            scroll={virtualizedScroll}
            loading={loading}
            size="small"
            {...tableProps}
            components={{
              body: {
                wrapper: ({ children, ...props }) => (
                  <tbody {...props}>
                    {children}
                  </tbody>
                )
              }
            }}
          />
        </div>
      </div>
    </VirtualizedContainer>
  );
};

export default VirtualizedTable; 