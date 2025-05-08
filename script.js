document.addEventListener('DOMContentLoaded', function() {
    const cameraContainer = document.getElementById('camera-container');
    const currentCameraTitle = document.getElementById('current-camera-title');
    const tabs = document.querySelectorAll('.tab');
    const statusIndicator = document.querySelector('.status-indicator');
    
    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Apply mobile-specific optimizations if needed
    if (isMobile) {
        document.body.classList.add('mobile-device');
        // Reduce animation intensity on mobile for better performance
        const glitchEffectInterval = 200; // Increase interval for mobile
    } else {
        const glitchEffectInterval = 50; // Default interval for desktop
    }
    
    // Cyberpunk glitch effect for elements
    function createGlitchEffect(element) {
        // Reduce glitch effect intensity on mobile devices
        const intensity = isMobile ? 0.98 : 0.95;
        const transformAmount = isMobile ? 1 : 2;
        
        setInterval(() => {
            if(Math.random() > intensity) {
                element.style.transform = `translate(${Math.random()*transformAmount}px, ${Math.random()*transformAmount}px)`;
                setTimeout(() => {
                    element.style.transform = 'translate(0, 0)';
                }, 100);
            }
        }, isMobile ? 200 : 50); // Less frequent on mobile
    }
    
    // Text glitch effect (scrambling text)
    function glitchText(element, originalText) {
        const glitchChars = '!@#$%^&*()_+{}:"<>?|[]\\;\',./-=';
        const glitchInterval = setInterval(() => {
            if (Math.random() > 0.99) {
                const newText = originalText.split('').map(char => {
                    return (Math.random() > 0.8) ? glitchChars[Math.floor(Math.random() * glitchChars.length)] : char;
                }).join('');
                
                element.textContent = newText;
                
                setTimeout(() => {
                    element.textContent = originalText;
                }, 100);
            }
        }, 100);
        
        return glitchInterval;
    }
    
    // Function to fetch cameras from our API
    async function fetchCameras() {
        try {
            const response = await fetch('/api/cameras');
            if (!response.ok) {
                throw new Error('Failed to fetch camera data');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching cameras:', error);
            return [];
        }
    }

    // Function to populate camera lists based on district (region)
    async function populateCameraLists() {
        const cameras = await fetchCameras();
        
        // If the API call fails or returns empty data, keep the existing hardcoded lists
        if (!cameras || cameras.length === 0) {
            console.log('Using hardcoded camera lists as API failed');
            // Skip clearing the lists and just initialize listeners
            initializeCameraListeners();
            return;
        }
        
        // Clear existing camera lists only if we got valid data from API
        document.querySelector('#moscow-cameras').innerHTML = '';
        document.querySelector('#dagestan-cameras').innerHTML = '';
        document.querySelector('#other-cameras').innerHTML = '';
        
        // Group cameras by district
        const moscowCameras = cameras.filter(camera => camera.district === 'Центральный' || camera.district.includes('Москва'));
        const dagestanCameras = cameras.filter(camera => camera.district.includes('Дагестан'));
        const otherCameras = cameras.filter(camera => 
            !camera.district.includes('Москва') && 
            !camera.district.includes('Центральный') && 
            !camera.district.includes('Дагестан')
        );
        
        // Populate Moscow cameras
        populateCameraList('moscow-cameras', moscowCameras);
        
        // Populate Dagestan cameras
        populateCameraList('dagestan-cameras', dagestanCameras);
        
        // Populate Other cameras
        populateCameraList('other-cameras', otherCameras);
        
        // Initialize camera listeners after populating
        initializeCameraListeners();
    }
    
    // Function to populate a specific camera list
    function populateCameraList(listId, cameras) {
        const list = document.getElementById(listId);
        
        cameras.forEach(camera => {
            const li = document.createElement('li');
            li.textContent = camera.name;
            li.setAttribute('data-url', camera.url);
            li.setAttribute('data-is-video', camera.is_video);
            li.setAttribute('data-id', camera.id);
            list.appendChild(li);
        });
    }
    
    // Function to display camera feed
    function displayCamera(url, title, isVideo) {
        // Clear the container
        cameraContainer.innerHTML = '';
        
        // Create a status indicator
        const statusEl = document.createElement('div');
        statusEl.className = 'status-indicator';
        statusEl.textContent = 'Подключение...';
        cameraContainer.appendChild(statusEl);
        
        // For mobile devices, we prioritize performance
        const connectionTime = isMobile ? 1000 : (Math.random() * 2000 + 1000);
        
        // Simulate connection process with random timing
        setTimeout(() => {
            statusEl.textContent = 'Камера активна';
            
            // Apply glitch text effect to status
            glitchText(statusEl, 'Камера активна');
            
            // Create a wrapper for the video and buttons
            const cameraWrapper = document.createElement('div');
            cameraWrapper.className = 'camera-wrapper';
            
            // Create camera feed container
            const feedContainer = document.createElement('div');
            feedContainer.className = 'feed-container';
            
            // Check if it's an image or video
            if (!isVideo || url.match(/\.(jpg|jpeg|png|gif)$/i) || url.includes('/poster/')) {
                // It's an image
                const img = document.createElement('img');
                img.src = url;
                img.alt = title;
                img.loading = "lazy"; // Add lazy loading for images
                feedContainer.appendChild(img);
            } else if (url.includes('.m3u8')) {
                // It's an HLS stream, use video element with hls.js
                const video = document.createElement('video');
                video.controls = true;
                video.autoplay = isMobile ? false : true; // Don't autoplay on mobile to save data
                video.muted = isMobile ? true : false; // Mute on mobile initially
                video.preload = isMobile ? "metadata" : "auto"; // Only preload metadata on mobile
                video.playsInline = true; // Better for iOS
                video.style.width = '100%';
                video.style.height = '100%';
                
                // Add hls.js script if not already present
                if (!window.Hls) {
                    const hlsScript = document.createElement('script');
                    hlsScript.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
                    hlsScript.onload = function() {
                        loadHlsStream(video, url);
                    };
                    document.head.appendChild(hlsScript);
                } else {
                    loadHlsStream(video, url);
                }
                
                feedContainer.appendChild(video);
            } else if (url.includes('rtsp.me/embed/') || url.includes('open.ivideon.com/embed/') || 
                      url.includes('geocam.ru') || url.includes('vk.com/video_ext') ||
                      url.includes('earthcam') || url.includes('yandex.ru/player')) {
                // It's an embedded player from a known streaming platform
                const iframe = document.createElement('iframe');
                iframe.src = url;
                iframe.allowFullscreen = true;
                iframe.loading = "lazy"; // Add lazy loading for iframes
                feedContainer.appendChild(iframe);
            } else {
                // Try with HTML5 video element
                const video = document.createElement('video');
                video.controls = true;
                video.autoplay = isMobile ? false : true;
                video.muted = isMobile ? true : false;
                video.preload = isMobile ? "metadata" : "auto";
                video.playsInline = true;
                video.style.width = '100%';
                video.style.height = '100%';
                
                try {
                    video.src = url;
                    video.onerror = function() {
                        // If video fails, fallback to iframe
                        feedContainer.removeChild(video);
                        const iframe = document.createElement('iframe');
                        iframe.src = url;
                        iframe.allowFullscreen = true;
                        iframe.loading = "lazy";
                        feedContainer.appendChild(iframe);
                    };
                } catch (e) {
                    // Fallback to iframe
                    const iframe = document.createElement('iframe');
                    iframe.src = url;
                    iframe.allowFullscreen = true;
                    iframe.loading = "lazy";
                    feedContainer.appendChild(iframe);
                }
                
                feedContainer.appendChild(video);
            }
            
            // Add feed container to wrapper
            cameraWrapper.appendChild(feedContainer);
            
            // Add wrapper to the main container
            cameraContainer.appendChild(cameraWrapper);
            
            // Apply glitch effect
            createGlitchEffect(cameraWrapper);
            
            // Update the title with occasional glitches
            currentCameraTitle.textContent = title;
            glitchText(currentCameraTitle, title);
            
            // Simulate occasional connection issues - less frequently on mobile
            const intervalTime = isMobile ? 5000 : 3000;
            
            setInterval(() => {
                if (Math.random() > (isMobile ? 0.95 : 0.85)) {
                    const statusMessages = [
                        'Камера активна',
                        'Переподключение...',
                        'Сигнал нестабилен',
                        'Шифрование...',
                        'Доступ разрешен'
                    ];
                    
                    const newStatus = statusMessages[Math.floor(Math.random() * statusMessages.length)];
                    statusEl.textContent = newStatus;
                    
                    if (newStatus === 'Переподключение...' || newStatus === 'Сигнал нестабилен') {
                        statusEl.style.color = 'var(--neon-red)';
                    } else {
                        statusEl.style.color = 'var(--cyber-green)';
                    }
                }
            }, intervalTime);
            
        }, connectionTime);
    }
    
    // Function to load HLS stream
    function loadHlsStream(videoElement, url) {
        if (Hls.isSupported()) {
            const hls = new Hls({
                // Optimize HLS settings for mobile
                maxBufferLength: isMobile ? 30 : 60,
                maxMaxBufferLength: isMobile ? 60 : 120,
                enableWorker: !isMobile, // Disable web workers on mobile for lower CPU usage
                lowLatencyMode: false
            });
            
            hls.loadSource(url);
            hls.attachMedia(videoElement);
            hls.on(Hls.Events.MANIFEST_PARSED, function() {
                // On mobile, don't autoplay until user interaction
                if (!isMobile) {
                    videoElement.play();
                }
            });
            hls.on(Hls.Events.ERROR, function(event, data) {
                if (data.fatal) {
                    // Try to recover, or fallback to iframe
                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                        hls.startLoad();
                    } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                        hls.recoverMediaError();
                    } else {
                        // Replace video with iframe as fallback
                        const parent = videoElement.parentNode;
                        parent.removeChild(videoElement);
                        
                        const iframe = document.createElement('iframe');
                        iframe.src = url;
                        iframe.allowFullscreen = true;
                        iframe.loading = "lazy";
                        parent.appendChild(iframe);
                    }
                }
            });
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            videoElement.src = url;
            videoElement.addEventListener('loadedmetadata', function() {
                if (!isMobile) {
                    videoElement.play();
                }
            });
        } else {
            // Fallback to iframe if HLS not supported
            const parent = videoElement.parentNode;
            parent.removeChild(videoElement);
            
            const iframe = document.createElement('iframe');
            iframe.src = url;
            iframe.allowFullscreen = true;
            iframe.loading = "lazy";
            parent.appendChild(iframe);
        }
    }
    
    // Tab switching functionality
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Get tab id
            const tabId = this.getAttribute('data-tab');
            
            // Hide all tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Show corresponding tab content
            const activeContent = document.querySelector(`.tab-content[data-tab="${tabId}"]`);
            if (activeContent) {
                activeContent.classList.add('active');
                
                // Select first camera in this tab if any
                const firstCamera = activeContent.querySelector('li');
                if (firstCamera) {
                    firstCamera.click();
                }
            }
        });
    });
    
    // Add click event listeners to all camera list items
    function initializeCameraListeners() {
        const allCameraListItems = document.querySelectorAll('#moscow-cameras li, #dagestan-cameras li, #other-cameras li');
        
        allCameraListItems.forEach(item => {
            item.addEventListener('click', function() {
                // Remove active class from all items
                allCameraListItems.forEach(li => li.classList.remove('active'));
                
                // Add active class to clicked item
                this.classList.add('active');
                
                // Get camera URL and title
                const url = this.getAttribute('data-url');
                const title = this.textContent;
                const isVideo = this.getAttribute('data-is-video') === 'true';
                
                // Display the camera
                displayCamera(url, title, isVideo);
            });
        });
        
        // Automatically display the first camera of the active tab when the page loads
        const activeTab = document.querySelector('.tab.active');
        if (activeTab) {
            const tabId = activeTab.getAttribute('data-tab');
            const activeContent = document.querySelector(`.tab-content[data-tab="${tabId}"]`);
            if (activeContent) {
                const firstCamera = activeContent.querySelector('li');
                if (firstCamera) {
                    firstCamera.click();
                }
            }
        }
    }
    
    // UI cyberpunk effects
    createGlitchEffect(document.querySelector('.title'));
    createGlitchEffect(document.querySelector('.subtitle'));
    
    // Control panel button effects
    const buttons = document.querySelectorAll('.button');
    buttons.forEach(button => {
        button.addEventListener('mouseover', () => {
            createGlitchEffect(button);
        });
        
        button.addEventListener('click', () => {
            button.style.boxShadow = `0 0 30px var(--primary-blue)`;
            setTimeout(() => {
                button.style.boxShadow = '';
            }, 300);
            
            if (button.textContent === 'Подключиться') {
                statusIndicator.textContent = 'Подключение к сети...';
                statusIndicator.style.color = 'var(--neon-red)';
                setTimeout(() => {
                    statusIndicator.textContent = 'Подключено';
                    statusIndicator.style.color = 'var(--cyber-green)';
                }, 1500);
            }
        });
    });
    
    // Call populateCameraLists on page load to fetch and populate cameras from API
    populateCameraLists();
    
    // If API fails, still show the hardcoded cameras
    initializeCameraListeners();
    
    // Add mobile-specific tap events to improve responsiveness
    if (isMobile) {
        document.querySelectorAll('.tab, .button, li').forEach(element => {
            element.addEventListener('touchstart', function() {
                this.classList.add('touch-active');
            });
            
            element.addEventListener('touchend', function() {
                this.classList.remove('touch-active');
            });
        });
    }
}); 