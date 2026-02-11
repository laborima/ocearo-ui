import React, { useState } from 'react';
import { useOcearoContext } from '../context/OcearoContext';
import { motion, AnimatePresence } from 'framer-motion';
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
      <div className="w-full h-full flex flex-col items-center justify-center tesla-card p-10 bg-hud-elevated">
        <div className="w-32 h-32 mb-6 relative group">
          <Image 
            src={service.icon} 
            alt={service.name}
            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700"
            width={128}
            height={128}
          />
        </div>
        <p className={`text-xl font-black uppercase tracking-widest mb-2 ${nightMode ? 'text-oNight' : 'text-hud-main'}`}>
          {service.name}
        </p>
        <p className={`text-xs font-black uppercase tracking-widest ${nightMode ? 'text-oNight' : 'text-hud-secondary'} opacity-80 mb-8 text-center`}>
          Redirecting to external node
        </p>
        <button
          onClick={() => handleOpenExternal(service.url)}
          className={`px-6 py-2.5 rounded text-xs font-black uppercase tracking-widest flex items-center transition-all duration-500 shadow-soft ${nightMode ? 'bg-oNight/20 text-oNight hover:bg-oNight/30 border border-oNight/30' : 'bg-oBlue text-hud-main hover:bg-blue-600 shadow-lg shadow-oBlue/20'}`}
        >
          <span>Launch mission</span>
          <FontAwesomeIcon icon={faExternalLinkAlt} className="ml-3 text-xs" />
        </button>
      </div>
    );
  };

  return (
    <div className="bg-rightPaneBg flex flex-col h-full p-4 overflow-hidden">
      <AnimatePresence mode="wait">
        {selectedService ? (
          <motion.div 
            key="viewer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-sm font-black uppercase tracking-widest flex items-center ${nightMode ? 'text-oNight' : 'text-hud-main'}`}>
                <div className="w-2 h-2 rounded-full bg-oBlue mr-3 animate-soft-pulse" />
                {selectedService.name}
              </h2>
              <button
                onClick={handleCloseViewer}
                className="p-2 rounded-full text-hud-muted tesla-hover"
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faTimes} className={`text-sm ${nightMode ? 'text-oNight' : ''}`} />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 rounded-sm overflow-hidden shadow-soft">
              {selectedService.external ? (
                renderSimulatedViewer(selectedService)
              ) : iframeError ? (
                <div className="w-full h-full flex flex-col items-center justify-center tesla-card p-10 bg-hud-bg">
                  <p className={`mb-6 text-sm font-black uppercase tracking-widest ${nightMode ? 'text-oNight' : 'text-hud-main'}`}>
                    Connection refused by {selectedService.name}
                  </p>
                  <a 
                    href={selectedService.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={`flex items-center text-xs font-black uppercase tracking-widest px-4 py-2 rounded transition-all duration-300 ${nightMode ? 'text-oNight hover:bg-oNight/10 border border-oNight/20' : 'text-oBlue hover:bg-oBlue/10 border border-oBlue/20'}`}
                  >
                    <span>Open External Node</span>
                    <FontAwesomeIcon icon={faExternalLinkAlt} className="ml-2" />
                  </a>
                </div>
              ) : (
                <iframe
                  src={selectedService.url}
                  title={selectedService.name}
                  className="w-full h-full rounded-sm border-0 bg-hud-bg"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  loading="lazy"
                  onError={handleIframeError}
                />
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full"
          >
            <h2 className={`text-sm font-black uppercase tracking-widest mb-6 flex items-center ${nightMode ? 'text-oNight' : 'text-hud-main'}`}>
              <FontAwesomeIcon icon={faExternalLinkAlt} className="mr-3 text-oBlue text-xs" />
              Entertainment Nodes
            </h2>
            
            {/* Services Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 overflow-auto pb-4 scrollbar-hide">
              {services.map((service) => (
                <button
                  key={service.name}
                  onClick={() => handleServiceClick(service)}
                  className="tesla-card p-6 flex flex-col items-center justify-center tesla-hover group border border-hud bg-hud-bg"
                >
                  <div className="w-20 h-20 mb-4 relative overflow-hidden flex items-center justify-center">
                    <Image 
                      src={service.icon} 
                      alt={service.name}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                      width={80}
                      height={80}
                    />
                  </div>
                  <span className={`text-xs font-black uppercase tracking-widest transition-colors duration-500 ${nightMode ? 'text-oNight' : 'text-hud-secondary group-hover:text-hud-main'}`}>
                    {service.name}
                  </span>
                  {service.external && (
                    <div className="mt-2 text-xs font-black text-oBlue opacity-0 group-hover:opacity-100 transition-opacity duration-500 uppercase tracking-tighter">
                      External Node
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MediaPlayer;