
require 'mechanize'
require 'bing-search'
require 'json'

API_KEY = 'Utu7oE4xxDzx44gHnZY4QMjDJwAXS3x56D7fS9m2q58' #change ;)


def get_headlines(searchterm)

	headlines = []

	BingSearch.account_key = API_KEY
	results = BingSearch.news(searchterm, highlighting: false)

	results.each do | r |
	    d = {:date => r.date,
	    	:title => r.title,
	    	:descr => r.description,
	    	:source => r.source}

	    headlines.push(d)
	end

	return headlines
end

def get_images(searchterm)

	images = []

	agent = Mechanize.new
	result = BingSearch.image(searchterm)

	result.each do | img |
	    #puts img.thumbnail.url
	    #puts img.url

	    encoded_image = Base64.encode64 agent.get("#{img.thumbnail.url}").body_io.string
	    #puts encoded_image
	    d = {:url => img.url,
	    	:img => encoded_image}
	    images.push(d)
	end

	return images
end

hl = get_headlines('Flüchtlinge')
puts hl.to_json

#imgs = get_images('Flüchtlinge')
#puts imgs.to_json