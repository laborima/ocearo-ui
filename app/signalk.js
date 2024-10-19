import { useEffect, useState } from 'react';
import SignalKClient from 'signalk-js-client';

const client = new SignalKClient({
  hostname: 'your-server-hostname',
  port: '3000',  // or your port
  protocol: 'http'
});

const ThreeDBoatView = () => {
  const [speed, setSpeed] = useState(0);

  useEffect(() => {
    client.get('/vessels/self/navigation/speedOverGround').then(data => {
      setSpeed(data.value);
    });
  }, []);

  return (
    <div>
      {/* Speed data display */}
      <div>{`Speed: ${speed}`}</div>
      {/* Other UI elements */}
    </div>
  );
};