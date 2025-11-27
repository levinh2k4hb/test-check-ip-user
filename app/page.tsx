'use client';

import { useState, useEffect } from 'react';

interface IPInfo {
  ipv4?: string;
  ipv6?: string;
  city?: string;
  region?: string;
  country?: string;
  isp?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
}

export default function Home() {
  const [ipInfo, setIpInfo] = useState<IPInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIPInfo = async () => {
      const apiUrls = [
        {
          url: 'https://api64.ipify.org?format=json',
          parser: (data: any) => {
            const ip = data.ip;
            if (ip.includes(':')) {
              return { ipv6: ip };
            } else {
              return { ipv4: ip };
            }
          }
        },
        {
          url: 'https://api.ipify.org?format=json',
          parser: (data: any) => ({ ipv4: data.ip })
        },
        {
          url: 'https://httpbin.org/ip',
          parser: (data: any) => {
            const ip = data.origin;
            if (ip.includes(':')) {
              return { ipv6: ip };
            } else {
              return { ipv4: ip };
            }
          }
        },
        {
          url: 'https://ipapi.co/json/',
          parser: (data: any) => {
            const result: any = {
              city: data.city,
              region: data.region,
              country: data.country_name,
              isp: data.org,
              timezone: data.timezone,
              latitude: data.latitude,
              longitude: data.longitude
            };
            if (data.ip.includes(':')) {
              result.ipv6 = data.ip;
            } else {
              result.ipv4 = data.ip;
            }
            return result;
          }
        }
      ];

      try {
        setLoading(true);
        setError(null);
        
        let combinedInfo: IPInfo = {};
        
        // Thử lấy thông tin từ các API
        for (const apiConfig of apiUrls) {
          try {
            const response = await fetch(apiConfig.url, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
              },
            });
            
            if (response.ok) {
              const data = await response.json();
              const parsedData = apiConfig.parser(data);
              
              // Merge thông tin mới vào combinedInfo
              combinedInfo = { ...combinedInfo, ...parsedData };
              
              // Nếu đã có cả IPv4 và thông tin địa lý thì break
              if (combinedInfo.ipv4 && combinedInfo.city) {
                break;
              }
            }
          } catch (apiError) {
            console.log(`API ${apiConfig.url} failed:`, apiError);
            continue;
          }
        }
        
        // Nếu có ít nhất một IP, set thông tin
        if (combinedInfo.ipv4 || combinedInfo.ipv6) {
          setIpInfo(combinedInfo);
          
          // Nếu chưa có thông tin địa lý, thử lấy thêm
          if (!combinedInfo.city && combinedInfo.ipv4) {
            try {
              const geoResponse = await fetch(`http://ip-api.com/json/${combinedInfo.ipv4}`);
              if (geoResponse.ok) {
                const geoData = await geoResponse.json();
                setIpInfo(prev => ({
                  ...prev!,
                  city: geoData.city,
                  region: geoData.regionName,
                  country: geoData.country,
                  isp: geoData.isp,
                  timezone: geoData.timezone,
                  latitude: geoData.lat,
                  longitude: geoData.lon
                }));
              }
            } catch (geoError) {
              console.log('Could not fetch geo info:', geoError);
            }
          }
          return;
        }
        
        // Nếu tất cả API đều fail
        throw new Error('All IP services are unavailable');
        
      } catch (err) {
        setError('Unable to fetch IP information. Please try again later.');
        console.error('Error fetching IP:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchIPInfo();
  }, []);

  const copyToClipboard = (text: string, type: string = 'IP address') => {
    navigator.clipboard.writeText(text).then(() => {
      alert(`${type} copied to clipboard!`);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Detecting your IP address...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
              What is My IP Address?
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 px-2">
              Discover your public IP address and location information
            </p>
          </div>

          {/* Main IP Card */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-700 mb-4 sm:mb-6">
                Your Public IP Addresses
              </h2>
              
              {/* IPv4 Section */}
              {ipInfo?.ipv4 && (
                <div className="mb-6">
                  <h3 className="text-lg sm:text-xl font-medium text-gray-600 mb-3">IPv4 Address</h3>
                  <div className="text-2xl sm:text-3xl lg:text-5xl font-mono font-bold text-blue-600 mb-4 p-4 sm:p-6 bg-blue-50 rounded-lg break-all">
                    {ipInfo.ipv4}
                  </div>
                  <button
                    onClick={() => copyToClipboard(ipInfo.ipv4!, 'IPv4 address')}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base mr-2 mb-2"
                  >
                    📋 Copy IPv4
                  </button>
                </div>
              )}
              
              {/* IPv6 Section */}
              {ipInfo?.ipv6 && (
                <div className="mb-6">
                  <h3 className="text-lg sm:text-xl font-medium text-gray-600 mb-3">IPv6 Address</h3>
                  <div className="text-xl sm:text-2xl lg:text-4xl font-mono font-bold text-green-600 mb-4 p-4 sm:p-6 bg-green-50 rounded-lg break-all">
                    {ipInfo.ipv6}
                  </div>
                  <button
                    onClick={() => copyToClipboard(ipInfo.ipv6!, 'IPv6 address')}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base mb-2"
                  >
                    📋 Copy IPv6
                  </button>
                </div>
              )}
              
              {/* No IP found */}
              {!ipInfo?.ipv4 && !ipInfo?.ipv6 && (
                <div className="text-2xl sm:text-3xl text-gray-500 mb-6 p-6 bg-gray-50 rounded-lg">
                  No IP address detected
                </div>
              )}
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-700 mb-6 sm:mb-8 text-center">
              Your Location & Network Information
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 sm:py-4 border-b border-gray-100">
                  <span className="font-medium text-gray-600 text-base sm:text-lg mb-1 sm:mb-0">🌍 Country:</span>
                  <span className="text-gray-800 text-base sm:text-lg font-semibold">{ipInfo?.country || 'N/A'}</span>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 sm:py-4 border-b border-gray-100">
                  <span className="font-medium text-gray-600 text-base sm:text-lg mb-1 sm:mb-0">🏙️ City:</span>
                  <span className="text-gray-800 text-base sm:text-lg font-semibold">{ipInfo?.city || 'N/A'}</span>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 sm:py-4 border-b border-gray-100">
                  <span className="font-medium text-gray-600 text-base sm:text-lg mb-1 sm:mb-0">📍 Region:</span>
                  <span className="text-gray-800 text-base sm:text-lg font-semibold">{ipInfo?.region || 'N/A'}</span>
                </div>
              </div>
              
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 sm:py-4 border-b border-gray-100">
                  <span className="font-medium text-gray-600 text-base sm:text-lg mb-1 sm:mb-0">🌐 ISP:</span>
                  <span className="text-gray-800 text-base sm:text-lg font-semibold text-left sm:text-right break-words">{ipInfo?.isp || 'N/A'}</span>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 sm:py-4 border-b border-gray-100">
                  <span className="font-medium text-gray-600 text-base sm:text-lg mb-1 sm:mb-0">🕒 Timezone:</span>
                  <span className="text-gray-800 text-base sm:text-lg font-semibold">{ipInfo?.timezone || 'N/A'}</span>
                </div>
                
                {ipInfo?.latitude && ipInfo?.longitude && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 sm:py-4 border-b border-gray-100">
                    <span className="font-medium text-gray-600 text-base sm:text-lg mb-1 sm:mb-0">📍 Coordinates:</span>
                    <span className="text-gray-800 text-base sm:text-lg font-semibold font-mono">
                      {ipInfo.latitude.toFixed(4)}, {ipInfo.longitude.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4 sm:mb-6 text-center">
              About Your IP Address
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="bg-blue-50 p-4 sm:p-6 rounded-lg">
                <h4 className="text-base sm:text-lg font-semibold text-blue-800 mb-2 sm:mb-3">🔒 Privacy Note</h4>
                <p className="text-gray-600 text-sm sm:text-base">
                  Your IP address is visible to websites you visit. Consider using a VPN for enhanced privacy protection.
                </p>
              </div>
              
              <div className="bg-green-50 p-4 sm:p-6 rounded-lg">
                <h4 className="text-base sm:text-lg font-semibold text-green-800 mb-2 sm:mb-3">🌐 What is an IP?</h4>
                <p className="text-gray-600 text-sm sm:text-base">
                  An IP address is a unique identifier assigned to your device by your Internet Service Provider (ISP).
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 sm:p-6 rounded-lg">
                <h4 className="text-base sm:text-lg font-semibold text-purple-800 mb-2 sm:mb-3">📊 IPv4 vs IPv6</h4>
                <p className="text-gray-600 text-sm sm:text-base">
                  IPv4 uses 32-bit addresses (like 192.168.1.1) while IPv6 uses 128-bit addresses (like 2001:db8::1) for more devices.
                </p>
              </div>
              
              <div className="bg-orange-50 p-4 sm:p-6 rounded-lg">
                <h4 className="text-base sm:text-lg font-semibold text-orange-800 mb-2 sm:mb-3">🔍 IP Detection</h4>
                <p className="text-gray-600 text-sm sm:text-base">
                  Your device may have both IPv4 and IPv6 addresses depending on your network configuration.
                </p>
              </div>
            </div>
            
            <div className="mt-6 sm:mt-8 text-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors w-full sm:w-auto text-sm sm:text-base"
              >
                🔄 Refresh Information
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 text-gray-500">
            <p>Last updated: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
