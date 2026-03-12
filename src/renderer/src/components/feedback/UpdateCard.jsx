import React from 'react';
import { useUpdate } from '../../contexts/UpdateContext';

const UpdateCard = () => {
  const { status, data, startUpdate } = useUpdate();

  const handleClick = () => {
    console.log('Update status:', status, 'Data:', data);

    if (status === 'available' || status === 'not-available') {
      startUpdate();
    }
  };

  return (
    <div>
      <div>Update status: {status}</div>
      {data ? <pre>{JSON.stringify(data, null, 2)}</pre> : null}
      <button type="button" onClick={handleClick}>
        Check / Install Update
      </button>
    </div>
  );
};

export default UpdateCard;
