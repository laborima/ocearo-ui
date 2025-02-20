import React, { useState } from 'react';
import { useOcearoContext } from '../context/OcearoContext';

const MediaPlayer = () => {
  const { nightMode } = useOcearoContext();
  const [selectedService, setSelectedService] = useState(null);

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
      url: 'https://widget.deezer.com/widget/auto/3155776842', 
      icon: '/icons/mediaplayer/deezer.png' 
    }
  ];

  const handleServiceClick = (service) => {
    if (service.external) {
      window.open(service.url, '_blank');
    } else {
      setSelectedService(service);
    }
  };

  return (
    <div className={`rightPaneBg ${nightMode ? 'oGray2' : 'text-gray-900'} flex flex-col h-full`}>
      {/* Services Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
        {services.map((service) => (
          <button
            key={service.name}
            onClick={() => handleServiceClick(service)}
            className={`rounded-lg aspect-video flex items-center justify-center transition-colors oGray2`}
          >
            <img src={service.icon} alt={service.name} className="w-full h-full p-4" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default MediaPlayer;