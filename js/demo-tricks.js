(() => {
 const D=window.DemoSession;
 const button=label=>[...document.querySelectorAll('#mact button')].find(b=>!b.disabled&&b.textContent===label);
 const click=(label,why)=>{const b=button(label);if(!b)return false;b.click();return why};
 const pick=(i,why)=>{const b=document.querySelectorAll('#mcols .sol-card')[i];if(!b||b.disabled)return false;b.click();return why};
 D.adapters.tricks=key=>{
  const E=D.tricks,s=E.s;if(!s||s.finished)return null;
  const input=document.querySelector('#mact input');
  if(input){const samples={vault1089:['741','741 reversed is 147; subtracting gives 594, whose reverse 495 adds to 1089.'],kaprekar:['3524','Start with 3524. Repeatedly sort all four digits high and low, subtracting with leading zeroes retained.'],stebbins:['17','Cut seventeen cards. A cut preserves the cyclic rank-and-suit relationship.'],missing:['48','Remember Seven. Ace through Ten total 55, so the other nine values total 48.'],rankcode:['145','Remember King of Clubs: (13 × 5 + 6) × 2 + 3 = 145.'],nines:['27','For example, 4321 − 1234 = 3087. Hide the nonzero 8 and enter the remaining digits 307, whose sum is 10.']};
   let [value,text]=samples[key];if(key==='nines')value='307';input.value=value;return click('Continue',text);
  }
  if(key==='binary'||key==='liar'){
   if(button('I have a card in mind'))return click('I have a card in mind','Remember '+D.name(s.cards[7])+'. Keep that same card through every window.');
   let bit=key==='binary'?(7>>s.answers.length)&1:E.hamming(7)[s.answers.length];const lie=key==='liar'&&s.answers.length===3;if(lie)bit^=1;
   return click(bit?'Yes':'No',(lie?'Use the one permitted lie here. ':'Answer '+(bit?'Yes':'No')+' for the remembered card. ')+(key==='liar'?'The seven-bit code can correct one mistaken answer.':'Each answer supplies one bit of the card index.'));
  }
  if(key==='vault1089')return click('Reverse that difference and add','Add 594 and 495 to get 1089, opening the sealed prediction.');
  if(key==='kaprekar')return click('Subtract','Perform the displayed high-minus-low subtraction. The four-digit process converges to 6174.');
  if(key==='kruskal'){if(s.index===undefined)return pick(3,'Begin at card four. Count Aces as one and faces as five; this chance experiment can miss.');return click('Count forward','Advance by the current card counting value. Paths may merge, but the outcome is not forced.');}
  if(key==='downunder')return click('Under / discard','Move the top card underneath, then discard the next. That exact order determines the predicted survivor.');
  if(key==='gilbreath'){if(!s.left)return click('Cut at 16','Make an even cut and reverse the first packet by dealing.');return click(s.left.length?'Take 3 left':'Take 5 right','Interleave a batch without changing either packet internal order. Every final adjacent pair retains opposite colours.');}
  if(key==='intuition')return click(s.index%2?'Black':'Red','Guess the next unseen colour before it is revealed. The shuffled card is fixed; this is an honest chance experiment.');
  if(key==='acesassembly'){
   D.turns=(D.turns||0)+1;const labels=['Rotate rows','Rotate all columns','Mirror columns','Gather columns'];return click(labels[(D.turns-1)%4],'Apply a whole-grid operation. These preserve the Aces in one column, unlike an unrestricted shuffle.');
  }
  if(key==='transversal'){const row=s.picked.length,col=[2,0,3,1][row];return pick(row*4+col,'Choose from row '+(row+1)+', using unused column '+(col+1)+'. One of each row and column guarantees total sixteen.');}
  if(key==='stebbins')return click('Predict the top','Use the bottom glimpse to calculate the next cyclic card: rank advances by three and suit by one.');
  if(key==='faro'){if(s.chosen===undefined)return pick(17,'Remember card eighteen and seal its home position before shuffling.');return click('Perfect out-shuffle','Perform one exact out-shuffle, keeping the first and last cards in place. Eight restore the whole deck.');}
  if(key==='parity')return click(s.step<3?'Exchange 3':'Reveal balance',s.step<3?'Exchange equal-sized packets so both piles remain at twenty-six cards.':'Count Reds on the left and Blacks on the right. Equal pile sizes force these two counts to match.');
  if(key==='missing')return click('I have the total','Think of Seven, then total the other nine cards without naming the missing one.');
  if(key==='fitch'){if(!s.code){const i=s.deck.findIndex(c=>!s.picked.includes(c));return pick(i,'Choose another distinct card ('+(s.picked.length+1)+'/5). Five cards guarantee a shared-suit pair.');}return click('+'+s.code.distance,'Read the shown L/M/H permutation to decode a forward distance of '+s.code.distance+'. The anchor supplies the hidden suit and starting rank.');}
  if(key==='keycard'){if(!s.keyCard)return pick(6,'Select a card to return immediately beside the secret key.');return click(s.step<2?'Cut 3':'Find my card',s.step<2?'Cut the packet without an internal shuffle. Circular neighbours stay together.':'Find the key, then reveal its following neighbour: the selection.');}
  if(key==='rewind'){
   if(button('Reverse the last operation'))return click('Reverse the last operation','Apply the inverse of the most recent operation first. Reversing the entire history restores every card.');
   return click(s.ops.length<3?['Reverse deck','Rotate quarter','Swap halves'][s.ops.length]:'Begin rewind',s.ops.length<3?'Record a reversible rearrangement; it can be undone exactly.':'Begin undoing the recorded operations in reverse order.');
  }
  if(key==='choice')return click(s.cards.length===4?'Choose right':'Choose left','Choose a packet. The performer decides whether KEEP or REMOVE preserves the predicted card; this is equivoque, not unrestricted elimination.');
  return false;
 };
 D.adapters.magic=key=>{
  const E=D.magic,cols=[...document.querySelectorAll('#mcols .mcol')],match=c=>c.r===E.card.r&&c.s===E.card.s;
  if(button('Play again'))return null;
  if(button('I’m thinking of a card'))return click('I’m thinking of a card','Remember '+D.name(E.card)+' from the opening spread and track that same card through every deal.');
  if(button('Deal a row'))return click('Deal a row','Deal one card to each pile in order. Consistent dealing preserves the gather calculation.');
  const glowing=cols.find(c=>c.classList.contains('on'));if(glowing){glowing.click();return 'Gather the glowing pile in the requested order. The chosen pile goes into the middle.'}
  const index=E.columns?E.columns.findIndex(p=>p.some(match)):-1;
  if(index<0)return false;
  if(button('That’s my card!')){
   if(!cols[index]||cols[index].classList.contains('dim'))return false;
   return click('That’s my card!','Press while the remembered card is highlighted. The timing reports the same information as a column answer.');
  }
  if(cols[index]&&typeof cols[index].onclick==='function'){cols[index].click();return 'Report pile '+(index+1)+', which contains '+D.name(E.card)+'. Middle gathering narrows its final position.'}
  return false;
 };
})();
