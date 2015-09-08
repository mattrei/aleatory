
require 'mechanize'
require 'bing-search'

API_KEY = 'Utu7oE4xxDzx44gHnZY4QMjDJwAXS3x56D7fS9m2q59' #change ;)
SEARCH = 'Flüchtlinge Zäune'

BingSearch.account_key = API_KEY
results = BingSearch.news(SEARCH, highlighting: false)

results.each do | r |
    puts "#{r.date} #{r.title} ----- #{r.description} #{r.source}"
end


agent = Mechanize.new
images = BingSearch.image(SEARCH)


images.each do | img |
    puts img.thumbnail.url
    #puts img.url

    encoded_image = Base64.encode64 agent.get("#{img.thumbnail.url}").body_io.string
    puts encoded_image
end
puts images.count

#require 'searchbing'
#bing_news = Bing.new(API_KEY, 50, 'News')
#bing_results = bing_news.search(SEARCH)
#puts bing_results[0]


puts results.count
#puts bing_results[0].count
