# aleatory
Samles
mit rate < 1 tieferer Ton
zB cutoff: (range 70, 90).look    → wird schneller/lauter

Synths
mit cutoff (random!!!) arbeiten
zawa - drückend, (gut als pulse wave)
blade - vibrierend, tief, elektronisch    - gut mit wooble
hoover - vibrierend, hoch, elektronisch
tb303 - hoch, vibrierend
hollow - leise, 
FX

subpulse -- wie bads
krush -- EXTREM
ixi_techno - verschleiert (gut mit distortion)
wobble - sci-fi, verzerrend
flanger - erhellend
normaliser - lauter, überlappend
pitch-shift - weich, slidend
ring-mod - klopfend, brummend
slicer - staccato, sci-fi (gut mit reverb)


Samples
elec_filt_snare - pfissssch
elec_cymbal - Metall schlagen
elec_blip2 - hohes Blip
elec_blip - old school blip
elec_beep - Telefon? schnell hintereinand
bass_hit_c - tief
bass_voxy - öhhh
bass_woodsy_c
bass_trance_c - tief, ätzend        

Rhythm
density 1 do        # 2 ist doppelt so schnell
end
Lambda

base = lambda do
  sample :drum_bass_soft, amp: 4, rate: 0.4, attack: 0.02, sustain: 1, release: 1, pan: 0.2
end

base.call

Chords
play chord(:a3, :m7).choose
play_pattern scale(:C, :major)
notes = scale(:C, :major, num_octaves: 2)
notes.tick  # tick through notes

play note(:f2, octave: 2)

play chord_degree(:v, :A2, :major)[1..3]

Scales
notes = (scale :e1, :minor_pentatonic, num_octaves: 2).shuffle
s = synth :dsaw, note: :e3, sustain: 8, note_slide: t, release: 0
control s, note: notes.tick


Threads
tick     oder tick(:foo)
look    oder look(:foo)
zB: tick(:note) if factor? tick, 4     → (knit :c2, 2, :e1, 1, :f3, 1).look(:note)    #alle 4 mal

sample :loop_amen
sleep sample_duration(:loop_amen)

:amp factor?(look, 4) ? 1 : 0
:amp 1 if factor?(look, 4)

cue :choir    # cue [:foo :bar :baz].choose
sync :choir

at [7, 12], [:crash, :within_oceans] do |m|
  cue m
end
Data
:cutoff = (range 60, 120, 10)    

notes = (ring 1, 2, 3) → list; 
OR
notes = (knit :e2, 5, :a3, 4)   # → ring( )
OR
notes = [:e3] * 12 # → array

(ring 1, 2, 3).tick     # liefert 1, 2 ,3, 1, 2, 
(ring 1, 2, 3).look        # wenn davor mittels tick erhöht (index)

notes.each do |n|
    play note n, :octave 2

end

use_sample_bpm :loop_amen, num_beats: 4     # loop is 4 beats long (sleep 4)


Learn
use_bpm 300

load_sample :drum_tom_lo_soft
load_sample :drum_tom_mid_soft

clapping = [1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0]

13.times do |cycle|
  puts "Cycle: #{cycle}"
  4.times do |reps|
    12.times do |beat|
      sample :drum_tom_lo_soft, pan: -0.5 if clapping[beat] == 1
      sample :drum_tom_mid_soft, attack: 0.05, pan:  0.5 if clapping[(cycle + beat) % 12] == 1
      sleep 1
    end
  end
end


Ruby
a = [1, 'hi', 3.14, 1, 2, [4, 5]]

a[2]             # => 3.14
a.[](2)          # => 3.14
a.reverse        # => [[4, 5], 2, 1, 3.14, 'hi', 1]
a.flatten.uniq   # => [1, 'hi', 3.14, 2, 4, 5]


hash = Hash.new # equivalent to hash = {}
hash = { :water => 'wet', :fire => 'hot' } # makes the previous line redundant as we are now
                                           # assigning hash to a new, separate hash object
puts hash[:fire] # prints "hot"

hash.each_pair do |key, value|   # or: hash.each do |key, value|
  puts "#{key} is #{value}"
end
# returns {:water=>"wet", :fire=>"hot"} and prints:
# water is wet
# fire is hot

hash.delete :water                            # deletes the pair :water => 'wet' and returns "wet"
hash.delete_if {|key,value| value == 'hot'}   # deletes the pair :fire => 'hot' and returns {}


Array init
Array.new(perc_length){rrand(0.5,1)}

LEVEL Fx for silencing synths

  with_fx :level, amp: bass_sine_level  do |level|
    #ctl_slide(level, slide_list) if audible()
    with_fx :reverb, room: 0.3 do
      pl_synth synth_list, bass_sine_patt
    end
  end
Tips

ATTACK: shift von unten
DECAY : verwunschen
SUSTAIN: gezogen (wie Rate einwenig)
RELEASE: wie Seite

LIBRARY

Metronome
live_loop :metronome do cue :whole;cue :half;cue :quarter sleep bar/4.0 cue :quarter sleep bar/4.0; cue :half cue :quarter sleep bar/4.0 cue :quarter sleep bar/4.0 end

Usage
pl_smp  -- hit_list, amp_list
pl_synth -- note_list, dur_list, amp_list

dur_list muss mit dur parameter by pl_smp übereinstimmen!
Code

require 'mathn'

tp = 1

# Methods for timing and playing the sequences

define :do_sleep do
  sleep tp
end

# Basic loop keeping the beat
live_loop :metro do
  do_sleep
end

define :audible do |level|
  level > 0
end

define :patt_length do |pattern|
  pattern[:dur_list].reduce(0, :+)
end

# :ctl_slide takes a variable representing a playing synth, sample or effect
# and a list of slide values, and slides the parameters in the list,
# where an example of slide_list is:
#  slide_list = [
#    {
#      param: "cutoff", values: [
#        {dur: 4, end_value: 30},
#        {dur: 4, end_value: 100}
#      ]
#    }
#  ]
define :ctl_slide do |ctl_focus, slide_list|
  slide_list.each_with_index do |slide, si|
    in_thread(name: "control_#{ctl_focus.id}_#{si}") do
      slide[:values].each do |val|
        control ctl_focus, {"#{slide[:param]}_slide"=> val[:dur]}
        control ctl_focus, {"#{slide[:param]}"=> val[:end_value]}
        sleep val[:dur]
      end
    end
  end
end

# :pl_synth takes a list of synths, a musical pattern, and an optional list of slide values
# similar to the one specified above, and uses each synth to simultaneously play
# the specified pattern, sliding the slide values if present.
define :pl_synth do |synth_list, pattern, slide_list = nil|
  pattern[:note_list].zip(pattern[:dur_list], pattern[:amp_list]) do |note, dur, amp|
    synth_list.each_with_index do |s, i|
      with_synth s[:synth] do
        attack = dur * 0
        sustain = dur * 1
        release = dur * 0
        new_amp = amp
        attack = s[:params][:attack] * dur if s[:params].has_key?(:attack)
        sustain = s[:params][:sustain] * dur if s[:params].has_key?(:sustain)
        release = s[:params][:release] * dur if s[:params].has_key?(:release)

        if s[:params].has_key?(:amp)
          new_amp *= s[:params][:amp]
        else
          new_amp /= synth_list.length
        end
        dur = attack + sustain + release

        with_synth_defaults s[:params], attack: attack, sustain: sustain, release: release do
          out = if note.respond_to?(:each)
            play_chord note, amp: amp
          else
            play note, amp: new_amp
          end

          if !rest?(note) && !slide_list.nil?
            ctl_slide(out, slide_list)
          end
        end
      end
    end
    sleep dur
  end
end

# :pl_smp plays a given sample with a given pattern, each hit separated by a given delay,
# Altering the sample if any sample parameters are specified, and shuffling 'hits'
# or amplitudes if specified.
define :pl_smp do |smp, pattern, params = {}, shuffle_hits, shuffle_amps, delay|
  pattern[:hit_list] = pattern[:hit_list].shuffle if shuffle_hits
  pattern[:amp_list] = pattern[:amp_list].shuffle if shuffle_amps

  pattern[:hit_list].zip(pattern[:amp_list]) do |val, amp|
    sample smp, params, amp: amp if val == 1
    sleep delay
  end
end


REST
require 'open-uri'
require 'json'
 open("http://api.openweathermap.org/data/2.5/weather?q=New%20York,NY&units=imperial") {|f|
    f.each_line do |line|
    j = JSON.parse(line)
    puts j['coord']['lon']
    end
  }




Sounds
define :electric do |note|
  with_fx :distortion do
    with_fx :compressor do
      with_fx :flanger do
        with_fx :ring_mod do
          synth :cnoise, note: note, attack: 0.5, sustain: 0.1,  release: 0.1, cutoff: rrand(80,120)
        end
      end
    end
  end
end
