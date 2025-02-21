import React, { useState } from 'react';
import { useOcearoContext } from '../context/OcearoContext';

const MediaPlayer = () => {
  const { nightMode } = useOcearoContext();
  const [selectedService, setSelectedService] = useState(null);
  const [iframeError, setIframeError] = useState(false);

  const services = [
    { 
      name: 'Netflix', 
      url: 'https://www.netflix.com', 
      icon: '/icons/mediaplayer/netflix.png',
      external: true
    },
    { 
      name: 'YouTube', 
      url: 'https://www.youtube.com', 
      icon: '/icons/mediaplayer/youtube.png',
      external: true
    },
    { 
      name: 'Disney+', 
      url: 'https://www.disneyplus.com', 
      icon: '/icons/mediaplayer/disneyplus.png',
      external: true
    },
    { 
      name: 'Prime Video', 
      url: 'https://www.primevideo.com', 
      icon: '/icons/mediaplayer/amazon.png',
      external: true
    },
    { 
      name: 'Deezer', 
      url: 'https://widget.deezer.com/widget/dark/playlist/1479458365', 
      icon: '/icons/mediaplayer/deezer.png'
    }
  ];

  const handleServiceClick = (service) => {
    if (service.external) {
      setSelectedService(service);
      setIframeError(false);
    } else {
      setSelectedService(service);
      setIframeError(false);
    }
  };

  const handleCloseViewer = () => {
    setSelectedService(null);
    setIframeError(false);
  };

  const handleIframeError = () => {
    setIframeError(true);
  };

  const handleOpenExternal = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const renderSimulatedViewer = (service) => {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-oGray3 rounded-lg p-6">
        <div className="w-32 h-32 mb-4 relative">
          {/* Using static img with proper loading attribute */}
          <img 
            src={service.icon} 
            alt={service.name}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        </div>
        <p className={`text-lg ${nightMode ? 'text-oNight' : 'text-gray-900'}`}>
          {service.name} cannot be embedded directly.
        </p>
        <p className={`text-sm ${nightMode ? 'text-oNight' : 'text-gray-600'} mb-4`}>
          Click below to open in a new tab.
        </p>
        <button
          onClick={() => handleOpenExternal(service.url)}
          className={`px-4 py-2 rounded-lg ${nightMode ? 'bg-oNight text-white hover:bg-oRed' : 'bg-gray-900 text-white hover:bg-red-500'} transition-colors`}
        >
          Open {service.name}
        </button>
      </div>
    );
  };

  return (
    <div className={`rightPaneBg ${nightMode ? 'text-oNight bg-oGray2' : 'text-gray-900 bg-oGray'} flex flex-col h-full p-4`}>
      {/* Services Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {services.map((service) => (
          <button
            key={service.name}
            onClick={() => handleServiceClick(service)}
            className={`rounded-lg flex items-center justify-center transition-colors hover:bg-oGray3 relative w-64 h-64`}
          >
            {/* Using static img with proper loading attribute */}
            <img 
              src={service.icon} 
              alt={service.name}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {/* Embedded Viewer or Simulated Viewer */}
      {selectedService && (
        <div className="mt-6 flex-1 flex flex-col relative">
          <div className="flex justify-between items-center mb-2">
            <h2 className={`text-lg font-semibold ${nightMode ? 'text-oNight' : 'text-gray-900'}`}>
              {selectedService.name}
            </h2>
            <button
              onClick={handleCloseViewer}
              className={`text-sm ${nightMode ? 'text-oNight hover:text-oRed' : 'text-gray-900 hover:text-red-500'}`}
            >
              Close
            </button>
          </div>
          {selectedService.external ? (
            renderSimulatedViewer(selectedService)
          ) : iframeError ? (
            <div className="w-full h-full flex items-center justify-center text-red-500">
              Unable to embed {selectedService.name}.{' '}
              <a 
                href={selectedService.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="underline ml-2 hover:text-red-700"
              >
                Open in new tab
              </a>
            </div>
          ) : (
            <iframe
              src={selectedService.url}
              title={selectedService.name}
              className="w-full h-full rounded-lg border-0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              loading="lazy"
              onError={handleIframeError}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default MediaPlayer;