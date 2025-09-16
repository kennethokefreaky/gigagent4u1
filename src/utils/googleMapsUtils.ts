// Google Maps API utilities for getting venue information

export interface VenueInfo {
  name: string;
  phoneNumber?: string;
  address: string;
  placeId?: string;
}

// Get venue phone number using Google Places API
export const getVenuePhoneNumber = async (address: string): Promise<string | null> => {
  try {
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API not loaded');
      return null;
    }

    const geocoder = new window.google.maps.Geocoder();
    
    return new Promise((resolve) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results && results.length > 0) {
          const placeId = results[0].place_id;
          
          if (placeId) {
            const service = new window.google.maps.places.PlacesService(
              document.createElement('div')
            );
            
            service.getDetails(
              {
                placeId: placeId,
                fields: ['name', 'formatted_phone_number', 'formatted_address']
              },
              (place, placeStatus) => {
                if (placeStatus === window.google.maps.places.PlacesServiceStatus.OK && place) {
                  resolve(place.formatted_phone_number || null);
                } else {
                  console.error('Error getting place details:', placeStatus);
                  resolve(null);
                }
              }
            );
          } else {
            resolve(null);
          }
        } else {
          console.error('Geocoding failed:', status);
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.error('Error getting venue phone number:', error);
    return null;
  }
};

// Get venue information (name, phone, address) using Google Places API
export const getVenueInfo = async (address: string): Promise<VenueInfo | null> => {
  try {
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API not loaded');
      return null;
    }

    const geocoder = new window.google.maps.Geocoder();
    
    return new Promise((resolve) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results && results.length > 0) {
          const placeId = results[0].place_id;
          
          if (placeId) {
            const service = new window.google.maps.places.PlacesService(
              document.createElement('div')
            );
            
            service.getDetails(
              {
                placeId: placeId,
                fields: ['name', 'formatted_phone_number', 'formatted_address']
              },
              (place, placeStatus) => {
                if (placeStatus === window.google.maps.places.PlacesServiceStatus.OK && place) {
                  resolve({
                    name: place.name || 'Venue',
                    phoneNumber: place.formatted_phone_number || undefined,
                    address: place.formatted_address || address,
                    placeId: placeId
                  });
                } else {
                  console.error('Error getting place details:', placeStatus);
                  resolve({
                    name: 'Venue',
                    address: address
                  });
                }
              }
            );
          } else {
            resolve({
              name: 'Venue',
              address: address
            });
          }
        } else {
          console.error('Geocoding failed:', status);
          resolve({
            name: 'Venue',
            address: address
          });
        }
      });
    });
  } catch (error) {
    console.error('Error getting venue info:', error);
    return {
      name: 'Venue',
      address: address
    };
  }
};



