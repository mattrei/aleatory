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
