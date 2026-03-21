/**
 * Simple Graceful Degradation Hook
 * Provides basic graceful degradation functionality
 */

import { useState, useEffect } from 'react';

export const useGracefulDegradation = () => {
  const [degradationLevel, setDegradationLevel] = useState('full');
  const [networkQuality, setNetworkQuality] = useState('good');

  const isFeatureEnabled = (feature) => {
    // For now, all features are enabled
    return true;
  };

  return {
    degradationLevel,
    networkQuality,
    isFeatureEnabled
  };
};

export const useDegradationAware = (componentName) => {
  const { degradationLevel, isFeatureEnabled } = useGracefulDegradation();

  const componentConfig = {
    enableCounterAnimations: isFeatureEnabled('animations'),
    enableChartAnimations: isFeatureEnabled('animations'),
    enableTransitions: isFeatureEnabled('animations')
  };

  const shouldAnimate = isFeatureEnabled('animations');

  return {
    componentConfig,
    shouldAnimate,
    degradationLevel
  };
};

export default useGracefulDegradation;