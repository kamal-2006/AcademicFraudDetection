const Loading = ({ size = 'md', fullScreen = false, message = 'Loading...' }) => {
  const sizeClass = {
    sm: 'spinner-sm',
    md: '',
    lg: 'spinner-lg',
  }[size];

  const spinner = (
    <div className="loading-spinner-wrapper">
      <div className={`spinner ${sizeClass}`}></div>
      {message && <p className="loading-text">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        <div className="loading-content">
          {spinner}
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
