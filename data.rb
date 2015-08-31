require 'nokogiri'
require 'open-uri'
require 'mechanize'

URL="http://www.tdcj.state.tx.us/death_row/"

define :get_executed do

  page = Nokogiri::HTML(open("#{URL}dr_executed_offenders.html"))

  ages = 0
  puts "Count #{page.xpath('//tr').to_a[0..200].count / 60}"

  page.xpath('//tr').to_a[0..200].each do |tr|
    a = tr.children.to_a
    #puts "#{a[7].text} #{a[9].text} Age: #{a[13].text} Date #{a[15].text} - #{a[17].text}"
    ages += a[13].text.to_i
  end
  puts "Avarge age: #{ages / page.xpath('//tr').count}"

  puts page.xpath('//tr').select{|x| x.children.to_a[17].text == 'Black'}.count
  puts page.xpath('//tr').select{|x| x.children.to_a[17].text == 'White'}.count
  puts page.xpath('//tr').select{|x| x.children.to_a[17].text == 'Hispanic'}.count
end

get_executed

define :get_scheduled_executions do
  agent = Mechanize.new
  page = Nokogiri::HTML(open("#{URL}dr_scheduled_executions.html"))

  page.xpath('//tr').to_a.drop(1).each do |tr|
    a = tr.children.to_a
    puts "#{a[7].text} #{a[9].text} Birth: #{a[11].text} Race: #{a[13].text} #{a[1].text}"
    link =  "http://www.tdcj.state.tx.us/death_row/#{a[3].children[0]['href']}"
    spage = Nokogiri::HTML(open(link))
    img = spage.css('img.photo_border_black_right')
    if !img.first.nil?
        encoded_image = Base64.encode64 agent.get("#{URL}/dr_info/#{img.first['src']}").body_io.string
        puts encoded_image
    end
  end
end


get_scheduled_executions
