import './SkeletonLoader.css';

const SkeletonLoader = ({ type = 'text', count = 1, height, width }) => {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  if (type === 'card') {
    return (
      <div className="skeleton-card">
        <div className="skeleton skeleton-avatar"></div>
        <div className="skeleton-content">
          <div className="skeleton skeleton-title"></div>
          <div className="skeleton skeleton-text"></div>
          <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
        </div>
      </div>
    );
  }

  if (type === 'table-row') {
    return (
      <tr className="skeleton-table-row">
        <td><div className="skeleton" style={{ height: '20px', width: '100%' }}></div></td>
        <td><div className="skeleton" style={{ height: '20px', width: '100%' }}></div></td>
        <td><div className="skeleton" style={{ height: '20px', width: '100%' }}></div></td>
      </tr>
    );
  }

  return (
    <div className="skeleton-wrapper">
      {skeletons.map((_, index) => (
        <div
          key={index}
          className="skeleton skeleton-text"
          style={{ 
            height: height || '1rem',
            width: width || (index === count - 1 ? '80%' : '100%')
          }}
        ></div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
