import React from 'react';

const KickIcon = ({ props, width = 26, height = 26 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 26 26"
      focusable="false"
      fill="none"
      width={width}
      height={height}
      {...props}
    >
      <path
        d="M1 0H9.76711V5.79452H12.589V2.82193H15.5616V0H24.1781V8.61645H21.3561V11.589H18.3836V14.411H21.3561V17.3836H24.1781V26H15.5616V23.1781H12.589V20.2055H9.76711V26H1V0Z"
        fill="#53FC18"
      ></path>
    </svg>
  );
};

export default KickIcon;
