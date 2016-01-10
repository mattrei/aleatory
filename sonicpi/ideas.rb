# G mixolydian
use_synth :blade
play_chord [:G2, :E3, :B3, :D]

sleep 1
play_chord [:G2, :C3, :B3]

sleep 1
play_chord [:G2, :C2, :B2]
sleep 1
2.times do
  with_fx :bitcrusher do
    with_fx :flanger do
      with_fx :slicer do
        play_pattern_timed [:E2, :D2, :G2, :G4, :G5], [0.5, 0.5, 0.5, 0.25, 0.5]
      end
    end
  end
end

live_loop :a do
  use_synth :fm
  tick
  # G2 -> C2, Bb2
  with_fx :reverb do
    play (note (ring :F3, :D2, :A3, :Bb3).look, octave: rand_i(3) + 2), amp: 1.5, pan: -0.25  if (spread 3, 8).look
    # C4 -> C5
    # shuffle
    play (shuffle (ring :C4, :E4, :D4, :F3)).look, amp: 0.6, pan: 0.25 if (spread 5, 12).look
    sleep 0.25
  end
end

