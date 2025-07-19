import React from 'react';
import { useResponsive, ResponsiveContainer, ResponsiveGrid } from './ResponsiveWrapper';
import styled from 'styled-components';

// 반응형 레이아웃 컴포넌트
const ResponsiveLayout = ({ 
  children, 
  sidebar = null,
  header = null,
  footer = null,
  sidebarWidth = 280,
  headerHeight = 64,
  footerHeight = 60,
  ...props 
}) => {
  const responsive = useResponsive();

  return (
    <LayoutContainer {...props}>
      {header && (
        <HeaderContainer height={headerHeight}>
          {header}
        </HeaderContainer>
      )}
      
      <MainContainer>
        {sidebar && responsive.isDesktop && (
          <SidebarContainer width={sidebarWidth}>
            {sidebar}
          </SidebarContainer>
        )}
        
        <ContentContainer 
          hasSidebar={sidebar && responsive.isDesktop}
          sidebarWidth={sidebarWidth}
        >
          <ResponsiveContainer>
            {children}
          </ResponsiveContainer>
        </ContentContainer>
      </MainContainer>
      
      {footer && (
        <FooterContainer height={footerHeight}>
          {footer}
        </FooterContainer>
      )}
    </LayoutContainer>
  );
};

// 반응형 대시보드 레이아웃
export const ResponsiveDashboard = ({ 
  children, 
  stats = [],
  actions = [],
  ...props 
}) => {
  const responsive = useResponsive();

  return (
    <DashboardContainer {...props}>
      {stats.length > 0 && (
        <StatsSection>
          <ResponsiveGrid 
            mobileCols={1}
            tabletCols={2}
            desktopCols={stats.length}
            largeCols={stats.length}
          >
            {stats.map((stat, index) => (
              <StatCard key={index}>
                <StatValue>{stat.value}</StatValue>
                <StatLabel>{stat.label}</StatLabel>
                {stat.icon && <StatIcon>{stat.icon}</StatIcon>}
              </StatCard>
            ))}
          </ResponsiveGrid>
        </StatsSection>
      )}
      
      {actions.length > 0 && (
        <ActionsSection>
          <ResponsiveGrid 
            mobileCols={1}
            tabletCols={2}
            desktopCols={actions.length}
            largeCols={actions.length}
          >
            {actions.map((action, index) => (
              <ActionCard key={index} onClick={action.onClick}>
                <ActionIcon>{action.icon}</ActionIcon>
                <ActionLabel>{action.label}</ActionLabel>
              </ActionCard>
            ))}
          </ResponsiveGrid>
        </ActionsSection>
      )}
      
      <ContentSection>
        {children}
      </ContentSection>
    </DashboardContainer>
  );
};

// 반응형 카드 레이아웃
export const ResponsiveCardLayout = ({ 
  children, 
  title,
  subtitle,
  actions = [],
  loading = false,
  error = null,
  ...props 
}) => {
  const responsive = useResponsive();

  return (
    <CardLayoutContainer {...props}>
      {(title || subtitle || actions.length > 0) && (
        <CardHeader>
          <CardTitleSection>
            {title && <CardTitle>{title}</CardTitle>}
            {subtitle && <CardSubtitle>{subtitle}</CardSubtitle>}
          </CardTitleSection>
          
          {actions.length > 0 && (
            <CardActions>
              {responsive.isMobile ? (
                <MobileActionsStack>
                  {actions.map((action, index) => (
                    <ActionButton 
                      key={index}
                      size="small"
                      onClick={action.onClick}
                      type={action.type || 'default'}
                    >
                      {action.icon}
                      {action.label}
                    </ActionButton>
                  ))}
                </MobileActionsStack>
              ) : (
                <DesktopActionsRow>
                  {actions.map((action, index) => (
                    <ActionButton 
                      key={index}
                      onClick={action.onClick}
                      type={action.type || 'default'}
                    >
                      {action.icon}
                      {action.label}
                    </ActionButton>
                  ))}
                </DesktopActionsRow>
              )}
            </CardActions>
          )}
        </CardHeader>
      )}
      
      <CardContent>
        {loading ? (
          <LoadingState>
            <div className="loading-spinner"></div>
            <p>로딩 중...</p>
          </LoadingState>
        ) : error ? (
          <ErrorState>
            <p>{error}</p>
          </ErrorState>
        ) : (
          children
        )}
      </CardContent>
    </CardLayoutContainer>
  );
};

// 반응형 테이블 레이아웃
export const ResponsiveTableLayout = ({ 
  children, 
  title,
  search = null,
  filters = [],
  pagination = null,
  ...props 
}) => {
  const responsive = useResponsive();

  return (
    <TableLayoutContainer {...props}>
      {(title || search || filters.length > 0) && (
        <TableHeader>
          {title && <TableTitle>{title}</TableTitle>}
          
          <TableControls>
            {search && (
              <SearchContainer>
                {search}
              </SearchContainer>
            )}
            
            {filters.length > 0 && (
              <FiltersContainer>
                {responsive.isMobile ? (
                  <MobileFilters>
                    {filters.map((filter, index) => (
                      <FilterItem key={index}>
                        {filter}
                      </FilterItem>
                    ))}
                  </MobileFilters>
                ) : (
                  <DesktopFilters>
                    {filters.map((filter, index) => (
                      <FilterItem key={index}>
                        {filter}
                      </FilterItem>
                    ))}
                  </DesktopFilters>
                )}
              </FiltersContainer>
            )}
          </TableControls>
        </TableHeader>
      )}
      
      <TableContent>
        {responsive.isMobile ? (
          <MobileTableWrapper>
            {children}
          </MobileTableWrapper>
        ) : (
          <DesktopTableWrapper>
            {children}
          </DesktopTableWrapper>
        )}
      </TableContent>
      
      {pagination && (
        <TablePagination>
          {pagination}
        </TablePagination>
      )}
    </TableLayoutContainer>
  );
};

// Styled Components
const LayoutContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: ${props => props.height}px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  z-index: 1000;
  display: flex;
  align-items: center;
  padding: 0 24px;
  
  @media (max-width: 768px) {
    padding: 0 16px;
  }
`;

const MainContainer = styled.main`
  display: flex;
  flex: 1;
  margin-top: ${props => props.headerHeight || 0}px;
`;

const SidebarContainer = styled.aside`
  width: ${props => props.width}px;
  background: #fafafa;
  border-right: 1px solid #e8e8e8;
  overflow-y: auto;
  position: fixed;
  top: ${props => props.headerHeight || 0}px;
  left: 0;
  bottom: ${props => props.footerHeight || 0}px;
  z-index: 999;
`;

const ContentContainer = styled.div`
  flex: 1;
  margin-left: ${props => props.hasSidebar ? props.sidebarWidth + 'px' : 0};
  padding: 24px;
  
  @media (max-width: 768px) {
    margin-left: 0;
    padding: 16px;
  }
`;

const FooterContainer = styled.footer`
  height: ${props => props.height}px;
  background: #fafafa;
  border-top: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  
  @media (max-width: 768px) {
    padding: 0 16px;
  }
`;

const DashboardContainer = styled.div`
  padding: 24px;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const StatsSection = styled.section`
  margin-bottom: 32px;
`;

const StatCard = styled.div`
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  position: relative;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const StatValue = styled.div`
  font-size: 32px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 8px;
  
  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #666;
  
  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const StatIcon = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 24px;
  color: #d9d9d9;
`;

const ActionsSection = styled.section`
  margin-bottom: 32px;
`;

const ActionCard = styled.div`
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #1890ff;
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
  }
  
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const ActionIcon = styled.div`
  font-size: 32px;
  color: #1890ff;
  margin-bottom: 12px;
  
  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const ActionLabel = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: #333;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const ContentSection = styled.section`
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 24px;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const CardLayoutContainer = styled.div`
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
`;

const CardHeader = styled.div`
  padding: 24px 24px 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  
  @media (max-width: 768px) {
    padding: 16px 16px 0;
    flex-direction: column;
    gap: 16px;
  }
`;

const CardTitleSection = styled.div``;

const CardTitle = styled.h2`
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
  
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const CardSubtitle = styled.p`
  margin: 0;
  font-size: 14px;
  color: #666;
  
  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const CardActions = styled.div``;

const MobileActionsStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

const DesktopActionsRow = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    border-color: #1890ff;
    color: #1890ff;
  }
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
    padding: 12px 16px;
    font-size: 16px;
  }
`;

const CardContent = styled.div`
  padding: 24px;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  color: #666;
`;

const ErrorState = styled.div`
  display: flex;
  justify-content: center;
  padding: 40px;
  color: #ff4d4f;
`;

const TableLayoutContainer = styled.div`
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
`;

const TableHeader = styled.div`
  padding: 24px 24px 0;
  
  @media (max-width: 768px) {
    padding: 16px 16px 0;
  }
`;

const TableTitle = styled.h2`
  margin: 0 0 16px 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
  
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const TableControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchContainer = styled.div`
  flex: 1;
  
  @media (max-width: 768px) {
    order: 1;
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 8px;
  
  @media (max-width: 768px) {
    order: 2;
  }
`;

const MobileFilters = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

const DesktopFilters = styled.div`
  display: flex;
  gap: 8px;
`;

const FilterItem = styled.div``;

const TableContent = styled.div`
  padding: 0 24px;
  
  @media (max-width: 768px) {
    padding: 0 16px;
  }
`;

const MobileTableWrapper = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const DesktopTableWrapper = styled.div``;

const TablePagination = styled.div`
  padding: 16px 24px;
  display: flex;
  justify-content: center;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

export default ResponsiveLayout; 