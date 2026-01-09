import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'md', overlay = false }) => {
  if (overlay) {
    return (
      <div className="loading-overlay">
        <div className={`spinner spinner-${size}`}></div>
      </div>
    );
  }

  return <div className={`spinner spinner-${size}`}></div>;
};

export default LoadingSpinner;
