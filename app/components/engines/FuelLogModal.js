import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGasPump, faClock, faEuroSign, faFlask, faTimes, faSave
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

/**
 * Modal component for logging fuel refills
 * Captures liters, cost (optional), additive usage, and engine hours
 */
const FuelLogModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  currentEngineHours = null,
  lastRefillEngineHours = null,
  loading = false 
}) => {
  const { t } = useTranslation();
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
      newErrors.liters = t('fuelLog.errorLiters');
    }
    
    if (formData.cost !== '' && parseFloat(formData.cost) < 0) {
      newErrors.cost = t('fuelLog.errorCost');
    }
    
    if (!formData.engineHours || parseFloat(formData.engineHours) < 0) {
      newErrors.engineHours = t('fuelLog.errorEngineHours');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEngineHoursChange = (value) => {
    const parsed = parseFloat(value);
    let hoursSince = formData.hoursSinceLastRefill;
    if (!isNaN(parsed) && lastRefillEngineHours !== null) {
      const computed = Math.round((parsed - lastRefillEngineHours) * 10) / 10;
      if (computed >= 0) {
        hoursSince = computed;
      }
    }
    setFormData(prev => ({ ...prev, engineHours: value, hoursSinceLastRefill: hoursSince }));
    if (errors.engineHours) {
      setErrors(prev => ({ ...prev, engineHours: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const costValue = formData.cost !== '' ? parseFloat(formData.cost) : null;

    onSave({
      liters: parseFloat(formData.liters),
      cost: costValue,
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
      className="fixed inset-0 bg-hud-bg/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-hud-bg backdrop-blur-xl rounded-3xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl border border-hud max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black text-hud-main flex items-center tracking-tight">
            <FontAwesomeIcon icon={faGasPump} className="mr-3 text-oYellow" />
            {t('fuelLog.logFuelRefill')}
          </h3>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-hud-secondary hover:text-hud-main hover:bg-hud-elevated transition-all duration-300"
            disabled={loading}
          >
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-hud-secondary mb-2 flex items-center">
              <FontAwesomeIcon icon={faGasPump} className="mr-2 text-oBlue" />
              {t('fuelLog.litersAdded')}
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.liters}
              onChange={(e) => handleInputChange('liters', e.target.value)}
              className={`w-full bg-hud-elevated text-hud-main px-4 py-3 rounded-xl border ${
                errors.liters ? 'border-red-500' : 'border-hud'
              } focus:border-oBlue focus:outline-none transition-all duration-300`}
              placeholder="Ex: 50"
              disabled={loading}
            />
            {errors.liters && (
              <p className="text-red-400 text-xs mt-2 font-medium">{errors.liters}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-hud-secondary mb-2 flex items-center">
              <FontAwesomeIcon icon={faEuroSign} className="mr-2 text-oGreen" />
              {t('fuelLog.cost')} <span className="text-hud-dim font-normal normal-case ml-1">({t('fuelLog.optional')})</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.cost}
              onChange={(e) => handleInputChange('cost', e.target.value)}
              className={`w-full bg-hud-elevated text-hud-main px-4 py-3 rounded-xl border ${
                errors.cost ? 'border-red-500' : 'border-hud'
              } focus:border-oBlue focus:outline-none transition-all duration-300`}
              placeholder="Ex: 85.50"
              disabled={loading}
            />
            {errors.cost && (
              <p className="text-red-400 text-xs mt-2 font-medium">{errors.cost}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-hud-secondary mb-2 flex items-center">
              <FontAwesomeIcon icon={faClock} className="mr-2 text-oYellow" />
              {t('fuelLog.currentEngineHours')}
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.engineHours}
              onChange={(e) => handleEngineHoursChange(e.target.value)}
              className={`w-full bg-hud-elevated text-hud-main px-4 py-3 rounded-xl border ${
                errors.engineHours ? 'border-red-500' : 'border-hud'
              } focus:border-oBlue focus:outline-none transition-all duration-300`}
              placeholder="Ex: 245.5"
              disabled={loading}
            />
            {errors.engineHours && (
              <p className="text-red-400 text-xs mt-2 font-medium">{errors.engineHours}</p>
            )}
            {currentEngineHours !== null && (
              <p className="text-hud-dim text-xs mt-2 font-medium">
                {t('fuelLog.signalkValue')} {Math.round(currentEngineHours * 10) / 10} h
              </p>
            )}
            {currentEngineHours === null && (
              <p className="text-hud-dim text-xs mt-2 font-medium">
                {t('fuelLog.noSignalkHours')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-hud-secondary mb-2 flex items-center">
              <FontAwesomeIcon icon={faClock} className="mr-2 text-hud-dim" />
              {t('fuelLog.hoursSinceLastRefill')}
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={formData.hoursSinceLastRefill}
              onChange={(e) => handleInputChange('hoursSinceLastRefill', e.target.value)}
              className="w-full bg-hud-elevated text-hud-main px-4 py-3 rounded-xl border border-hud focus:border-oBlue focus:outline-none transition-all duration-300 disabled:opacity-60"
              placeholder="Ex: 25.5"
              disabled={loading || (lastRefillEngineHours !== null && formData.hoursSinceLastRefill !== '')}
            />
            {lastRefillEngineHours !== null && (
              <p className="text-hud-dim text-xs mt-2 font-medium">
                {t('fuelLog.lastRefillAt')} {Math.round(lastRefillEngineHours * 10) / 10} h
              </p>
            )}
          </div>

          <div className="flex items-center p-1">
            <input
              type="checkbox"
              id="additive"
              checked={formData.additive}
              onChange={(e) => handleInputChange('additive', e.target.checked)}
              className="w-5 h-5 rounded border-hud bg-hud-elevated text-oBlue focus:ring-oBlue transition-all duration-300"
              disabled={loading}
            />
            <label htmlFor="additive" className="ml-3 text-sm font-bold text-hud-secondary flex items-center cursor-pointer hover:text-hud-main transition-colors duration-300">
              <FontAwesomeIcon icon={faFlask} className="mr-2 text-purple-400 opacity-70" />
              {t('fuelLog.additiveAdded')}
            </label>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-hud">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-hud-elevated hover:bg-hud-bg text-hud-main font-bold rounded-xl transition-all duration-300"
              disabled={loading}
            >
              {t('fuelLog.cancel')}
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-oBlue hover:bg-blue-600 text-hud-main font-bold rounded-xl transition-all duration-300 flex items-center disabled:opacity-50 shadow-lg shadow-oBlue/20"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-3 font-normal">⏳</span>
                  {t('fuelLog.saving')}
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} className="mr-2" />
                  {t('fuelLog.save')}
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
