import { useState, useEffect } from 'react';

const useBreakpoints = () => {
  const [breakpoints, setBreakpoints] = useState({
    sm: false,
    md: false,
    lg: false,
    xl: false,
  });

  useEffect(() => {
    const handleResize = () => {
      const { innerWidth } = window;
      setBreakpoints({
        sm: innerWidth < 576,
        md: innerWidth >= 576 && innerWidth < 768,
        lg: innerWidth >= 768 && innerWidth < 992,
        xl: innerWidth >= 992,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call to set breakpoints on mount

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return breakpoints;
};

export default useBreakpoints;