const props = {
  bitrate: 6500,
  speed: 26.22,
  uptime: 1256
};

const titleElement = document.querySelector('.overlay-title');
const bitrateElement = document.getElementById('overlay-bitrate');
const speedElement = document.querySelector('.overlay-speed');

titleElement.textContent = 'Bitrate Overlay';
bitrateElement.textContent = `Bitrate: ${props.bitrate} Kbps`;
speedElement.textContent = `Speed: ${props.speed} Mbps`;
$('.overlay-uptime').text(`Uptime: ${props.uptime} seconds`);
