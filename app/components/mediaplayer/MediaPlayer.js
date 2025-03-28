import React, { useState } from 'react';
import { useOcearoContext } from '../context/OcearoContext';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';

const MediaPlayer = () => {
  const { nightMode } = useOcearoContext();
  const [selectedService, setSelectedService] = useState(null);
  const [iframeError, setIframeError] = useState(false);

  const services = [
    { 
      name: 'Netflix', 
      url: 'https://www.netflix.com', 
      icon: './icons/mediaplayer/netflix.png',
      external: true
    },
    { 
      name: 'YouTube', 
      url: 'https://www.youtube.com', 
      icon: './icons/mediaplayer/youtube.png',
      external: true
    },
    { 
      name: 'Disney+', 
      url: 'https://www.disneyplus.com', 
      icon: './icons/mediaplayer/disneyplus.png',
      external: true
    },
    { 
      name: 'Prime Video', 
      url: 'https://www.primevideo.com', 
      icon: './icons/mediaplayer/amazon.png',
      external: true
    },
    { 
      name: 'Spotify', 
      url: 'https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M', 
      icon: './icons/mediaplayer/spotify.png'
    },
    { 
      name: 'Deezer', 
      url: 'https://widget.deezer.com/widget/dark/playlist/1479458365', 
      icon: './icons/mediaplayer/deezer.png'
    }
  ];

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setIframeError(false);
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
      <div className="w-full h-full flex flex-col items-center justify-center bg-oGray2 rounded-lg p-6 shadow-lg">
        <div className="w-32 h-32 mb-4 relative">
          <Image 
            src={service.icon} 
            alt={service.name}
            className="w-full h-full object-contain"
            width={128}
            height={128}
          />
        </div>
        <p className={`text-lg font-semibold ${nightMode ? 'text-oNight' : 'text-white'}`}>
          {service.name}
        </p>
        <p className={`text-sm ${nightMode ? 'text-oNight' : 'text-white'} opacity-80 mb-4 text-center`}>
          This service will open in a new browser window
        </p>
        <button
          onClick={() => handleOpenExternal(service.url)}
          className={`px-4 py-2 rounded-md flex items-center ${nightMode ? 'bg-oNight hover:bg-oRed' : 'bg-oBlue hover:bg-blue-600'} text-white transition-colors`}
        >
          <span>Open {service.name}</span>
          <FontAwesomeIcon icon={faExternalLinkAlt} className="ml-2 text-sm" />
        </button>
      </div>
    );
  };

  return (
    <div className="bg-rightPaneBg flex flex-col h-full p-6 overflow-auto">
      {selectedService ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-700">
            <h2 className={`text-lg font-semibold ${nightMode ? 'text-oNight' : 'text-white'}`}>
              {selectedService.name}
            </h2>
            <button
              onClick={handleCloseViewer}
              className="p-2 rounded-full hover:bg-gray-700"
              aria-label="Close"
            >
              <FontAwesomeIcon icon={faTimes} size="lg" className={`${nightMode ? 'text-oNight' : 'text-white'}`} />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 rounded-lg overflow-hidden">
            {selectedService.external ? (
              renderSimulatedViewer(selectedService)
            ) : iframeError ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-oGray2 rounded-lg p-6">
                <p className={`mb-3 ${nightMode ? 'text-oNight' : 'text-white'}`}>
                  Unable to embed {selectedService.name}
                </p>
                <a 
                  href={selectedService.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={`underline flex items-center ${nightMode ? 'text-oNight hover:text-oRed' : 'text-white hover:text-blue-300'}`}
                >
                  <span>Open in new tab</span>
                  <FontAwesomeIcon icon={faExternalLinkAlt} className="ml-1 text-sm" />
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
        </div>
      ) : (
        <>
          <h2 className={`text-lg font-semibold ${nightMode ? 'text-oNight' : 'text-white'} mb-4`}>
            Media Services
          </h2>
          
          {/* Services Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {services.map((service) => (
              <button
                key={service.name}
                onClick={() => handleServiceClick(service)}
                className="bg-oGray2 p-4 rounded-lg flex flex-col items-center justify-center transition-colors hover:bg-gray-700 shadow-lg"
              >
                <div className="w-24 h-24 mb-3">
                  <Image 
                    src={service.icon} 
                    alt={service.name}
                    className="w-full h-full object-contain"
                    width={96}
                    height={96}
                  />
                </div>
                <span className={`text-sm font-medium ${nightMode ? 'text-oNight' : 'text-white'}`}>
                  {service.name}
                </span>
                {service.external && (
                  <FontAwesomeIcon 
                    icon={faExternalLinkAlt} 
                    className={`text-sm mt-1 ${nightMode ? 'text-oNight' : 'text-white'} opacity-80`} 
                  />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MediaPlayer;