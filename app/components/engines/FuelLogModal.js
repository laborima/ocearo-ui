import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGasPump, faClock, faEuroSign, faFlask, faTimes, faSave
} from '@fortawesome/free-solid-svg-icons';

/**
 * Modal component for logging fuel refills
 * Captures liters, cost, additive usage, and engine hours
 */
const FuelLogModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  currentEngineHours = null,
  lastRefillEngineHours = null,
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    liters: '',
    cost: '',
    additive: false,
    engineHours: '',
    hoursSinceLastRefill: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      const engineHoursValue = currentEngineHours !== null 
        ? Math.round(currentEngineHours * 10) / 10 
        : '';
      
      let hoursSince = '';
      if (currentEngineHours !== null && lastRefillEngineHours !== null) {
        hoursSince = Math.round((currentEngineHours - lastRefillEngineHours) * 10) / 10;
      }

      setFormData({
        liters: '',
        cost: '',
        additive: false,
        engineHours: engineHoursValue,
        hoursSinceLastRefill: hoursSince
      });
      setErrors({});
    }
  }, [isOpen, currentEngineHours, lastRefillEngineHours]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.liters || parseFloat(formData.liters) <= 0) {
      newErrors.liters = 'Please enter a valid number of liters';
    }
    
    if (!formData.cost || parseFloat(formData.cost) < 0) {
      newErrors.cost = 'Please enter a valid cost';
    }
    
    if (!formData.engineHours || parseFloat(formData.engineHours) < 0) {
      newErrors.engineHours = 'Please enter engine hours';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSave({
      liters: parseFloat(formData.liters),
      cost: parseFloat(formData.cost),
      additive: formData.additive,
      engineHours: parseFloat(formData.engineHours),
      hoursSinceLastRefill: formData.hoursSinceLastRefill 
        ? parseFloat(formData.hoursSinceLastRefill) 
        : null,
      previousEngineHours: lastRefillEngineHours
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-oGray2 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white flex items-center">
            <FontAwesomeIcon icon={faGasPump} className="mr-3 text-oYellow" />
            Log Fuel Refill
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={loading}
          >
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white mb-2 flex items-center">
              <FontAwesomeIcon icon={faGasPump} className="mr-2 text-oBlue" />
              Liters Added *
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.liters}
              onChange={(e) => handleInputChange('liters', e.target.value)}
              className={`w-full bg-oGray text-white px-4 py-3 rounded-lg border ${
                errors.liters ? 'border-red-500' : 'border-gray-600'
              } focus:border-oBlue focus:outline-none`}
              placeholder="Ex: 50"
              disabled={loading}
            />
            {errors.liters && (
              <p className="text-red-400 text-sm mt-1">{errors.liters}</p>
            )}
          </div>

          <div>
            <label className="block text-white mb-2 flex items-center">
              <FontAwesomeIcon icon={faEuroSign} className="mr-2 text-oGreen" />
              Cost (€) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.cost}
              onChange={(e) => handleInputChange('cost', e.target.value)}
              className={`w-full bg-oGray text-white px-4 py-3 rounded-lg border ${
                errors.cost ? 'border-red-500' : 'border-gray-600'
              } focus:border-oBlue focus:outline-none`}
              placeholder="Ex: 85.50"
              disabled={loading}
            />
            {errors.cost && (
              <p className="text-red-400 text-sm mt-1">{errors.cost}</p>
            )}
          </div>

          <div>
            <label className="block text-white mb-2 flex items-center">
              <FontAwesomeIcon icon={faClock} className="mr-2 text-oYellow" />
              Current Engine Hours *
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.engineHours}
              onChange={(e) => handleInputChange('engineHours', e.target.value)}
              className={`w-full bg-oGray text-white px-4 py-3 rounded-lg border ${
                errors.engineHours ? 'border-red-500' : 'border-gray-600'
              } focus:border-oBlue focus:outline-none`}
              placeholder="Ex: 245.5"
              disabled={loading}
            />
            {errors.engineHours && (
              <p className="text-red-400 text-sm mt-1">{errors.engineHours}</p>
            )}
            {currentEngineHours !== null && (
              <p className="text-gray-400 text-sm mt-1">
                SignalK value: {Math.round(currentEngineHours * 10) / 10} h
              </p>
            )}
          </div>

          <div>
            <label className="block text-white mb-2 flex items-center">
              <FontAwesomeIcon icon={faClock} className="mr-2 text-gray-400" />
              Hours Since Last Refill
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.hoursSinceLastRefill}
              onChange={(e) => handleInputChange('hoursSinceLastRefill', e.target.value)}
              className="w-full bg-oGray text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-oBlue focus:outline-none"
              placeholder="Ex: 25.5"
              disabled={loading}
            />
            {lastRefillEngineHours !== null && (
              <p className="text-gray-400 text-sm mt-1">
                Last refill at {Math.round(lastRefillEngineHours * 10) / 10} h
              </p>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="additive"
              checked={formData.additive}
              onChange={(e) => handleInputChange('additive', e.target.checked)}
              className="w-5 h-5 rounded border-gray-600 bg-oGray text-oBlue focus:ring-oBlue"
              disabled={loading}
            />
            <label htmlFor="additive" className="ml-3 text-white flex items-center cursor-pointer">
              <FontAwesomeIcon icon={faFlask} className="mr-2 text-purple-400" />
              Additive Added
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-oBlue hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Saving...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} className="mr-2" />
                  Save
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FuelLogModal;
