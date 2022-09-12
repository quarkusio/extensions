const torontoResults = [
  {
    latitude: 43.6534817,
    longitude: -79.3839347,
    formattedAddress: "Old Toronto, Toronto, Golden Horseshoe, Ontario, Canada",
    country: "Canada",
    city: "Old Toronto",
    state: "Ontario",
    zipcode: undefined,
    streetName: undefined,
    streetNumber: undefined,
    countryCode: "CA",
    neighbourhood: "",
    provider: "openstreetmap"
  },
  {
    latitude: 43.6534817,
    longitude: -79.3839347,
    formattedAddress: "Toronto, Golden Horseshoe, Ontario, Canada",
    country: "Canada",
    city: "Toronto",
    state: "Ontario",
    zipcode: undefined,
    streetName: undefined,
    streetNumber: undefined,
    countryCode: "CA",
    neighbourhood: "",
    provider: "openstreetmap"
  },
  {
    latitude: 41.9050213,
    longitude: -90.8640346,
    formattedAddress: "Toronto, Clinton County, Iowa, United States",
    country: "United States",
    city: "Toronto",
    state: "Iowa",
    zipcode: undefined,
    streetName: undefined,
    streetNumber: undefined,
    countryCode: "US",
    neighbourhood: "",
    provider: "openstreetmap"
  }
];

const londonResults = [
  {
    latitude: 51.5073219,
    longitude: -0.1276474,
    formattedAddress: "London, Greater London, England, United Kingdom",
    country: "United Kingdom",
    city: "London",
    state: "England",
    zipcode: undefined,
    streetName: undefined,
    streetNumber: undefined,
    countryCode: "GB",
    neighbourhood: "",
    provider: "openstreetmap"
  },
  {
    latitude: 51.5156177,
    longitude: -0.0919983,
    formattedAddress: "City of London, Greater London, England, United Kingdom",
    country: "United Kingdom",
    city: "City of London",
    state: "England",
    zipcode: undefined,
    streetName: undefined,
    streetNumber: undefined,
    countryCode: "GB",
    neighbourhood: "",
    provider: "openstreetmap"
  },
  {
    latitude: 51.50888405,
    longitude: -0.1283741501862351,
    formattedAddress:
      "National Gallery, Whitcomb Street, St. James's, Covent Garden, London, Greater London, England, WC2N 5DN, United Kingdom",
    country: "United Kingdom",
    city: "London",
    state: "England",
    zipcode: "WC2N 5DN",
    streetName: "Whitcomb Street",
    streetNumber: undefined,
    countryCode: "GB",
    neighbourhood: "St. James's",
    provider: "openstreetmap"
  }
];

const milanResults = [{ country: "Italy" }];

// Trivial implementation, which we have validated against the real API for the first two cases
const results = { Toronto: torontoResults, "London, UK": londonResults, Milan: milanResults };

// We want to track invocations, so don't recreate the mocks every time the constructor is called
const oneConstantMock = { geocode: jest.fn().mockImplementation(city => results[city]) };

const mock = jest.fn().mockImplementation(() => {
  return oneConstantMock;
});

module.exports = mock;
