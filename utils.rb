bar = 1.0
live_loop :metronome do
  cue :whole;cue :half;cue :quarter
  sleep bar/4.0
  cue :quarter
  sleep bar/4.0; cue :half
  cue :quarter
  sleep bar/4.0
  cue :quarter
  sleep bar/4.0
end

live_loop :foo do

  tick
  sample :bd_pure
  2.times do
    #    sample :perc_snap, rate: factor?(look, 2) ? 1 : 0.5
    sleep 0.125
  end
  sleep 0.25
  # sample :perc_snap

  sleep 0.5
end

live_loop :mel do

  tick
  tick
  v = Vector[5,8].normalize
  v2 = Vector[look,-2].normalize


  synth :sine, cutoff: 50, pan: v.inner_product(v2).round(2)
  sleep 1

end
