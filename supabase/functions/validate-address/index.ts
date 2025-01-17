import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AddressComponents {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GooglePlacesResponse {
  results: {
    address_components: AddressComponents[];
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }[];
  status: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { address } = await req.json()
    console.log('Original address submitted:', address)
    
    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')
    if (!googleApiKey) {
      throw new Error('Google Maps API key not configured')
    }

    const encodedAddress = encodeURIComponent(address)
    console.log('Calling Google Places API with encoded address:', encodedAddress)
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&components=country:US&key=${googleApiKey}`
    )
    
    const data: GooglePlacesResponse = await response.json()
    
    // Log the complete Google API response for debugging
    console.log('Complete Google Places API response:', JSON.stringify(data, null, 2))

    if (data.status !== 'OK') {
      throw new Error(`Address validation failed: ${data.status}`)
    }

    const result = data.results[0]
    let streetNumber = ''
    let route = ''
    let city = ''
    let state = ''
    let zipCode = ''
    let originalComponents: Record<string, string> = {}

    // Store original address components for comparison
    const addressParts = address.split(',').map(part => part.trim())
    if (addressParts[0]) {
      originalComponents.street_address = addressParts[0]
    }
    if (addressParts[1]) {
      originalComponents.city = addressParts[1]
      console.log('Original city component:', addressParts[1])
    }
    if (addressParts[2]) {
      const stateParts = addressParts[2].split(' ')
      if (stateParts[0]) originalComponents.state = stateParts[0]
      if (stateParts[1]) originalComponents.zip_code = stateParts[1]
    }

    // Parse standardized components from Google's response
    result.address_components.forEach((component) => {
      if (component.types.includes('street_number')) {
        streetNumber = component.long_name
      }
      if (component.types.includes('route')) {
        route = component.long_name
      }
      if (component.types.includes('locality')) {
        city = component.long_name
        console.log('Google API returned city:', component.long_name)
      }
      if (component.types.includes('administrative_area_level_1')) {
        state = component.short_name
      }
      if (component.types.includes('postal_code')) {
        zipCode = component.long_name
      }
    })

    const standardizedAddress = {
      street_address: `${streetNumber} ${route}`.trim(),
      city,
      state,
      zip_code: zipCode,
      formatted_address: result.formatted_address,
      coordinates: result.geometry.location,
      original_components: originalComponents,
      standardization_changes: {
        street_changed: originalComponents.street_address?.toLowerCase() !== `${streetNumber} ${route}`.trim().toLowerCase(),
        city_changed: originalComponents.city?.toLowerCase() !== city.toLowerCase(),
        state_changed: originalComponents.state?.toLowerCase() !== state.toLowerCase(),
        zip_changed: originalComponents.zip_code !== zipCode
      }
    }

    console.log('City comparison:', {
      original: originalComponents.city,
      standardized: city,
      changed: originalComponents.city?.toLowerCase() !== city.toLowerCase()
    })

    return new Response(
      JSON.stringify(standardizedAddress),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})