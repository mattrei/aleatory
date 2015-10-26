require 'nokogiri'
require 'open-uri'
require 'mechanize'
require 'json'

URL="http://www.tdcj.state.tx.us/death_row/"


def get_encoded_img(agent, link)

  spage = Nokogiri::HTML(open(link))
  img = spage.css('img.photo_border_black_right')
  if !img.first.nil?
    return "data:image/jpeg;base64," + Base64.encode64(agent.get("#{URL}/dr_info/#{img.first['src']}").body_io.string)
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
      img: img}
    a_executed.push(d)
  end
  #puts "Avarge age: #{ages / people.count}"
  #puts "Since #{people.last[15].text}"

#  puts page.xpath('//tr').select{|x| x.children.to_a[17].text == 'Black'}.count
#  puts page.xpath('//tr').select{|x| x.children.to_a[17].text == 'White'}.count
#  puts page.xpath('//tr').select{|x| x.children.to_a[17].text == 'Hispanic'}.count

  return a_executed.reverse

end

#exec = get_executed(100)
#puts exec.to_json


def get_scheduled
  arr = []
  all_scheduled = false
  page = Nokogiri::HTML(open("#{URL}dr_scheduled_executions.html"))
  agent = Mechanize.new

  sched = []

  page.xpath('//tr').to_a.drop(1).each do |tr|
    a = tr.children.to_a
    img = get_encoded_img(agent, "#{URL}#{a[3].children[0]['href']}")
    d = {:img => img,
         :date => a[1].text,
         :fn => a[5].text,
         :ln => a[7].text,
         :birth => a[11].text,
         :since => a[15].text}
    sched.push(d)
  end
  all_scheduled = true
  return sched
end

sched = get_scheduled()
puts sched.to_json

