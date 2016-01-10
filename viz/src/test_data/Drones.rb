require 'geocoder'

result = Geocoder.search("Shawal, North Waziristan")
result = result.first

puts result.geometry["location"]
