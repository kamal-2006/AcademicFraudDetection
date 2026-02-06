const Loading = ({ size = 'md', fullScreen = false }) => {
  const sizeClass = {
    sm: 'spinner-sm',
    md: '',
    lg: 'spinner-lg',
  }[size];

  const spinner = (
    <div className={`spinner ${sizeClass}`}></div>
  );

  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        <div className="loading-content">
          {spinner}
          <p className="loading-text">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="loading-container">
      {spinner}
    </div>
  );
};

export default Loading;
