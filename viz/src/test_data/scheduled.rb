require 'nokogiri'
require 'open-uri'
require 'mechanize'
require 'json'

URL="http://www.tdcj.state.tx.us/death_row/"


def get_encoded_img(agent, link)

  spage = Nokogiri::HTML(open(link))
  img = spage.css('img.photo_border_black_right')
  if !img.first.nil?
    return Base64.encode64 agent.get("#{URL}/dr_info/#{img.first['src']}").body_io.string
  end
  return ''
end

def get_executed(nr)
  a_executed = []

  page = Nokogiri::HTML(open("#{URL}dr_executed_offenders.html"))

  ages = 0
  agent = Mechanize.new

  people = page.xpath('//tr').to_a[1..nr]
  people.each do |tr|
    a = tr.children.to_a
    #puts "#{a[7].text} #{a[9].text} Age: #{a[13].text} Date #{a[15].text} - #{a[17].text}"
    ages += a[13].text.to_i

    img = get_encoded_img(agent, "#{URL}#{a[3].children[0]['href']}")

    d = {name: "#{a[9].text} #{a[7].text}", age: a[13].text, 
      race: a[17].text, date: a[15].text,
      img: "data:image/jpeg;base64,#{img}"}
    a_executed.push(d)
  end
  #puts "Avarge age: #{ages / people.count}"
  #puts "Since #{people.last[15].text}"

#  puts page.xpath('//tr').select{|x| x.children.to_a[17].text == 'Black'}.count
#  puts page.xpath('//tr').select{|x| x.children.to_a[17].text == 'White'}.count
#  puts page.xpath('//tr').select{|x| x.children.to_a[17].text == 'Hispanic'}.count

  return a_executed.reverse

end

exec = get_executed(200)
puts exec.to_json


def get_scheduled
  arr = []
  all_scheduled = false
  page = Nokogiri::HTML(open("#{URL}dr_scheduled_executions.html"))
  agent = Mechanize.new

  page.xpath('//tr').to_a.drop(1).each do |tr|
    a = tr.children.to_a
    link =  "#{URL}#{a[3].children[0]['href']}"
    spage = Nokogiri::HTML(open(link))
    img = spage.css('img.photo_border_black_right')
    if !img.first.nil?
#      puts "#{a[7].text} #{a[9].text} Birth: #{a[11].text} Race: #{a[13].text} #{a[1].text}"
      encoded_image = Base64.encode64 agent.get("#{URL}/dr_info/#{img.first['src']}").body_io.string
      d = {}
      d[:img] = encoded_image
      d[:date] = a[1].text
      arr.push(d)
    end
  end
  all_scheduled = true
end

