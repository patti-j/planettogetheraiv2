
const openOnLoad = false

let chatOpen = false;
let chatLoaded = false;

function preloadChat() {
	const chat = document.getElementById('chatbot-31a4499b565259e8-chat');

	if (!chatLoaded) {
		chat.innerHTML += '<iframe id="inner-iframe" src="//embed.chatnode.ai/31a4499b565259e8?context=popup" allow="clipboard-read; clipboard-write" width="100%" height="100%" onload="iframeLoaded()" style="border: none; margin: 0px !important;"></iframe>';
		chat.innerHTML += '<div id="loading-indicator" class="cnx-spinner cnx-loading-indicator" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; justify-content: center; align-items: center; background-color: #f8f8f8; z-index: 100;"><svg viewBox="25 25 50 50"><circle cx="50" cy="50" r="20" fill="none" class="path"</circle></svg></div>';

		chatLoaded = true;
	}
}

function toggleChat() {
	const chat = document.getElementById('chatbot-31a4499b565259e8-chat');
	const tooltip = document.getElementById('chat-popup-tooltip');

	const chatButton = document.getElementById('toggle-btn-31a4499b565259e8');
	const closeButton = document.getElementById('close-btn-31a4499b565259e8');

	if (tooltip) {
		tooltip.style.display = 'none';
	}

	if (!chatLoaded) {
		chat.innerHTML += '<iframe id="inner-iframe" src="//embed.chatnode.ai/31a4499b565259e8?context=popup" allow="clipboard-read; clipboard-write" width="100%" height="100%" onload="iframeLoaded()" style="border: none; margin: 0px !important;"></iframe>';
		chat.innerHTML += '<div id="loading-indicator" class="cnx-spinner cnx-loading-indicator" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; justify-content: center; align-items: center; background-color: #f8f8f8; z-index: 100;"><svg viewBox="25 25 50 50"><circle cx="50" cy="50" r="20" fill="none" class="path"</circle></svg></div>';

		chatLoaded = true;
	}

	if (chatOpen) {
		chat.classList.add('cnx-slide-down');
		setTimeout(() => {
			chat.classList.remove('open', 'cnx-slide-down');
		}, 800);
		chatButton.innerHTML = '<svg clip-rule="evenodd" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" version="1.1" width="45" height="45" viewBox="0 0 64 64" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><g><path d="m0 32c0-17.673 14.327-32 32-32s32 14.327 32 32-14.327 32-32 32-32-14.327-32-32z" fill="#333333"/><path d="m26 16c-5.5228 0-10 4.4772-10 10v12c0 5.5228 4.4772 10 10 10h19.5c1.3807 0 2.5-1.1193 2.5-2.5v-19.5c0-5.5228-4.4772-10-10-10h-12zm-0.75 16c0 1.1046-0.8954 2-2 2s-2-0.8954-2-2 0.8954-2 2-2 2 0.8954 2 2zm8.75 0c0 1.1046-0.8954 2-2 2s-2-0.8954-2-2 0.8954-2 2-2 2 0.8954 2 2zm6.75 2c1.1046 0 2-0.8954 2-2s-0.8954-2-2-2-2 0.8954-2 2 0.8954 2 2 2z" fill="#FFFFFF" fill-rule="evenodd"/></g></svg>';
		chatButton.classList.add('cnx-fade-in');
		setTimeout(() => chatButton.classList.remove('cnx-fade-in'), 1500);
	} else {
		chat.classList.add('open');
		console.log(closeButton)
		chatButton.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; width: 45px; height: 45px; border-radius: 50%; background-color: #1796D3;"><svg xmlns="http://www.w3.org/2000/svg" fill="none" width="32px" height="32px" viewBox="0 0 24 24" stroke-width="1.5" stroke="#FFFFFF"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg></div>';
	}
	chatOpen = !chatOpen;
}

function iframeLoaded() {
	console.log('iframe loaded');
	const chat = document.getElementById('chatbot-' + '31a4499b565259e8' + '-chat');
	const loadingIndicator = chat.querySelector('.cnx-loading-indicator');
	loadingIndicator.classList.add('fade-out');
	if (loadingIndicator) {
		setTimeout(() => {
			loadingIndicator.remove();
		}, 800);
	}
}

const popperScript = document.createElement('script');
popperScript.src = 'https://unpkg.com/@popperjs/core@2';
document.head.appendChild(popperScript)

document.addEventListener('DOMContentLoaded', () => {
	const body = document.querySelector('body');
	body.insertAdjacentHTML('beforeend', `
	<div id="chatbot-31a4499b565259e8">
	<div id="chatbot-31a4499b565259e8-chat">

	</div>
		<div id="toggle-btn-31a4499b565259e8" role="button" onclick="toggleChat()" onmouseover="preloadChat()" aria-label="Open AI Chat">
			<svg clip-rule="evenodd" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" version="1.1" width="45" height="45" viewBox="0 0 64 64" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><g><path d="m0 32c0-17.673 14.327-32 32-32s32 14.327 32 32-14.327 32-32 32-32-14.327-32-32z" fill="#333333"/><path d="m26 16c-5.5228 0-10 4.4772-10 10v12c0 5.5228 4.4772 10 10 10h19.5c1.3807 0 2.5-1.1193 2.5-2.5v-19.5c0-5.5228-4.4772-10-10-10h-12zm-0.75 16c0 1.1046-0.8954 2-2 2s-2-0.8954-2-2 0.8954-2 2-2 2 0.8954 2 2zm8.75 0c0 1.1046-0.8954 2-2 2s-2-0.8954-2-2 0.8954-2 2-2 2 0.8954 2 2zm6.75 2c1.1046 0 2-0.8954 2-2s-0.8954-2-2-2-2 0.8954-2 2 0.8954 2 2 2z" fill="#FFFFFF" fill-rule="evenodd"/></g></svg>
		</div>
			<div></div>
		<style>
			#chatbot-31a4499b565259e8 {
				z-index:9999999;
				overflow: visible;
				user-select: none;
			}

			#chatbot-31a4499b565259e8-chat{
				position: fixed;
				border-radius: 18px 18px 0 0;
				overflow: hidden;
				bottom: 0;
				right: 0;
				left: 0;
				height: 0;
				z-index: 9999999;
				transition-property: transform;
				transition-duration: 0.7s;
				opacity: 0;
				transform: translateY(80%);
			}
			
			#chatbot-31a4499b565259e8-chat.open{
				height: 75vh;
				bottom: 100px;
				opacity: 1;
				transform: translateY(0%);
			}

			#toggle-btn-31a4499b565259e8{
				box-sizing: content-box;
				position: fixed;
				outline: 0;
				border: none;
				bottom: 20px;
				right: 20px;
				width:56px;
				height: 56px;
				z-index: 9999998;
				cursor: pointer;
			}

			@media only screen and (max-width: 600px) {
				#toggle-btn-31a4499b565259e8 {
					bottom: 40px;
				}
			}

			#chatbot-31a4499b565259e8 iframe{
				border: none;
			}

			@media(min-width: 768px){
				#chatbot-31a4499b565259e8-chat{
					width: 400px;
					bottom: 84px;
					left: auto;
					top: auto !important;
					right: 20px;
					max-height: min(704px, 100% - 104px);
					border-radius: 18px;
				}
				#chatbot-31a4499b565259e8-chat.open{
					height: calc(100vh - 114px);
				}
			}

			#chat-popup-tooltip {
				background-color: #666666;
				color: #FFFFFF;
				border-radius: 4px;
				padding: 8px 16px;
				font-weight: 500;
				z-index: 9999999;

				max-width: calc(100vw - 20px); 
      	max-height: calc(100vh - 20px); 
			}

			.cnx-loading-indicator {
				opacity: 1;
				font-size: 24px;
				font-weight: 500;
			}

			.cnx-glow-box {
				box-shadow: 2px 2px 20px #00000060, 0px 0px 5px #00000060;
			}

			#arrow,
			#arrow::before {
				position: absolute;
				width: 12px;
				height: 12px;
				background: inherit;
			}

			#arrow {
				visibility: hidden;
			}

			#arrow::before {
				visibility: visible;
				content: '';
				transform: rotate(45deg);
			}

			#chat-popup-tooltip[data-popper-placement^='top'] > #arrow {
				bottom: -4px;
			}
			
			#chat-popup-tooltip[data-popper-placement^='left'] > #arrow {
				right: -4px;
			}
			
			#chat-popup-tooltip[data-popper-placement^='right'] > #arrow {
				left: -4px;
			}

			.cnx-grow-button { 
				transition: all .2s ease-in-out; 
			}
				
			.cnx-grow-button:hover { 
				transform: scale(1.1); 
			}

			@keyframes fadeOut {
				from {
						opacity: 1;
				}
				to {
						opacity: 0;
				}
			}
			
			.fade-out {
					animation: fadeOut 1s forwards; /* 'forwards' keeps the element in the final state of the animation */
			}

			@keyframes slideDown {
					from {
							transform: translateY(0%);
							opacity: 1;
					}
					to {
							transform: translateY(100%);
							opacity: 0;
					}
			}

			@keyframes fadeIn {
					from {
							opacity: 0;
					}
					to {
							opacity: 1;
					}
			}
			
			.cnx-fade-in {
					animation: fadeIn 1.75s forwards;
			}
		
			.cnx-slide-down {
				animation: slideDown 0.7s forwards; 
			}

			.cnx-spinner {
				margin-top: -21px;
				position: absolute;
				text-align: center;
				top: 50%;
				width: 100%;
			}

			.cnx-spinner svg {
				-webkit-animation: loading-rotate 2s linear infinite;
				-moz-animation: loading-rotate 2s linear infinite;
				-o-animation: loading-rotate 2s linear infinite;
				animation: loading-rotate 2s linear infinite;
				height: 120px;
				width: 120px;
			}

			.cnx-spinner .path {
				stroke-dasharray: 90, 150;
				stroke-dashoffset: 0;
				stroke-width: 2;
				stroke: #0E94D2;
				stroke-linecap: round;
				-webkit-animation: loading-dash 1.5s ease-in-out infinite;
				-moz-animation: loading-dash 1.5s ease-in-out infinite;
				-o-animation: loading-dash 1.5s ease-in-out infinite;
				animation: loading-dash 1.5s ease-in-out infinite;
			}

			@-webkit-keyframes loading-rotate {
				to {
					-webkit-transform: rotate(1turn);
					transform: rotate(1turn);
				}
			}

			@-moz-keyframes loading-rotate {
				to {
					-moz-transform: rotate(1turn);
					transform: rotate(1turn);
				}
			}

			@-o-keyframes loading-rotate {
				to {
					-o-transform: rotate(1turn);
					transform: rotate(1turn);
				}
			}

			@keyframes loading-rotate {
				to {
					-webkit-transform: rotate(1turn);
					-moz-transform: rotate(1turn);
					-o-transform: rotate(1turn);
					transform: rotate(1turn);
				}
			}

			@-webkit-keyframes loading-dash {
				0% {
					stroke-dasharray: 1, 200;
					stroke-dashoffset: 0;
				}
				50% {
					stroke-dasharray: 90, 150;
					stroke-dashoffset: -40px;
				}
				to {
					stroke-dasharray: 90, 150;
					stroke-dashoffset: -120px;
				}
			}

			@-moz-keyframes loading-dash {
				0% {
					stroke-dasharray: 1, 200;
					stroke-dashoffset: 0;
				}
				50% {
					stroke-dasharray: 90, 150;
					stroke-dashoffset: -40px;
				}
				to {
					stroke-dasharray: 90, 150;
					stroke-dashoffset: -120px;
				}
			}

			@-o-keyframes loading-dash {
				0% {
					stroke-dasharray: 1, 200;
					stroke-dashoffset: 0;
				}
				50% {
					stroke-dasharray: 90, 150;
					stroke-dashoffset: -40px;
				}
				to {
					stroke-dasharray: 90, 150;
					stroke-dashoffset: -120px;
				}
			}

			@keyframes loading-dash {
				0% {
					stroke-dasharray: 1, 200;
					stroke-dashoffset: 0;
				}
				50% {
					stroke-dasharray: 90, 150;
					stroke-dashoffset: -40px;
				}
				to {
					stroke-dasharray: 90, 150;
					stroke-dashoffset: -120px;
				}
			}
		</style>
	</div>`);
	body.style.margin = '0';

	//loadPopperJs(() => {
	//	if (openOnLoad) {
	//		toggleChat();
	//	}

	//	setupPopper();
	//});
});

function loadPopperJs(callback) {
	const popperScript = document.createElement('script');
	popperScript.src = 'https://unpkg.com/@popperjs/core@2';
	popperScript.onload = () => callback();
	document.head.appendChild(popperScript);
}

function setupPopper() {
	const chatButton = document.getElementById('toggle-btn-31a4499b565259e8');
	chatButton.classList.add('cnx-grow-button');
	const tooltip = document.getElementById('chat-popup-tooltip');

	if (tooltip) {
		tooltip.style.display = 'block';
	}

	const popperInstance = Popper.createPopper(chatButton, tooltip, {
		placement: 'top',
		strategy: 'fixed',
		modifiers: [
			{
				name: 'offset',
				options: {
					offset: [0, 10],
				},
			}
		],
	});

	// Force scale to 1
	const metaTag = document.createElement('meta');
	metaTag.setAttribute('name', 'viewport');
	metaTag.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
	document.head.appendChild(metaTag);

	window.addEventListener('resize', () => {
		popperInstance.update();
	});

	window.addEventListener('orientationchange', () => {
		popperInstance.update();
	});

	tooltip.classList.add('cnx-fade-in');
	setTimeout(() => tooltip.classList.remove('cnx-fade-in'), 1000);
}
