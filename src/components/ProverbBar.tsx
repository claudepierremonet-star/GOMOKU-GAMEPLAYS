import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quote } from 'lucide-react';

const QUOTES = [
  // Chinois
  { text: "Un voyage de mille lieues commence toujours par un premier pas.", zh: "千里之行，始于足下。", origin: "Lao Tseu" },
  { text: "L'échec est la mère du succès.", zh: "失败乃成功之母。", origin: "Proverbe chinois" },
  { text: "Mieux vaut allumer une bougie que maudire les ténèbres.", zh: "与其诅咒黑暗，不如燃起蜡烛。", origin: "Proverbe chinois" },
  { text: "Exige beaucoup de toi-même et attends peu des autres.", zh: "躬自厚而薄责于人。", origin: "Confucius" },
  { text: "L'homme honorable commence par appliquer ce qu'il veut enseigner.", zh: "先行其言而后从之。", origin: "Confucius" },
  { text: "Celui qui déplace la montagne, c'est celui qui commence à enlever les petites pierres.", zh: "移山者，始于搬走小石。", origin: "Confucius" },
  { text: "Le sage n'a pas d'idées arrêtées, il fait siennes les idées du peuple.", zh: "圣人无常心，以百姓心为心。", origin: "Lao Tseu" },
  { text: "La porte la mieux fermée est celle qu'on peut laisser ouverte.", zh: "善闭，无关键而不可开。", origin: "Proverbe chinois" },
  { text: "Point n'est besoin d'élever la voix quand on a raison.", zh: "有理不在声高。", origin: "Proverbe chinois" },
  { text: "On ne peut pas empêcher les oiseaux de la tristesse de voler au-dessus de nos têtes, mais on peut les empêcher de faire leurs nids dans nos cheveux.", zh: "你无法阻止悲伤的鸟儿从头顶飞过，但你可以阻止它们在你的头发里筑巢。", origin: "Proverbe chinois" },
  // Français
  { text: "Petit à petit, l'oiseau fait son nid.", zh: "聚沙成塔，集腋成裘。", origin: "Proverbe français" },
  { text: "Vouloir, c'est pouvoir.", zh: "有志者事竟成。", origin: "Proverbe français" },
  { text: "Rien ne sert de courir ; il faut partir à point.", zh: "欲速则不达。", origin: "Jean de La Fontaine" },
  { text: "La patience est une fleur qui ne pousse pas dans tous les jardins.", zh: "耐心是一朵并非在所有花园里都能盛开的花。", origin: "Proverbe français" },
  { text: "Paris ne s'est pas fait en un jour.", zh: "巴黎不是一天建成的。", origin: "Proverbe français" },
  { text: "Après la pluie, le beau temps.", zh: "雨过天晴。", origin: "Proverbe français" },
  { text: "Il n'y a pas de réussite facile ni d'échecs définitifs.", zh: "没有轻易的成功，也没有绝对的失败。", origin: "Marcel Proust" },
  // Philosophie & Sagesse
  { text: "Il n'y a pas de vent favorable pour celui qui ne sait où il va.", zh: "对于不知道驶向何方的人来说，没有顺风。", origin: "Sénèque" },
  { text: "Connais-toi toi-même.", zh: "认识你自己。", origin: "Socrate" },
  { text: "La vie est un mystère qu'il faut vivre, et non un problème à résoudre.", zh: "生活是一个需要去经历的谜，而不是一个需要解决的问题。", origin: "Gandhi" },
  { text: "Le bonheur n'est pas une destination, mais une façon de voyager.", zh: "幸福不是终点，而是一种旅行的方式。", origin: "Margaret Lee Runbeck" },
  { text: "Qui craint de souffrir, souffre déjà de ce qu'il craint.", zh: "害怕痛苦的人，已经在他所害怕的痛苦中了。", origin: "Montaigne" },
  { text: "Il faut cultiver notre jardin.", zh: "我们必须耕种自己的花园。", origin: "Voltaire" },
  { text: "La vraie sagesse est de ne pas sembler sage.", zh: "大智若愚。", origin: "Eschyle" },
  { text: "La folie, c'est de faire toujours la même chose et de s'attendre à un résultat différent.", zh: "疯狂就是重复做同一件事，却期待不同的结果。", origin: "Albert Einstein" },
  { text: "Ce qui ne me tue pas me rend plus fort.", zh: "杀不死我的，只会让我更强大。", origin: "Friedrich Nietzsche" },
  { text: "Le seul vrai savoir est de savoir que l'on ne sait rien.", zh: "唯一真正的智慧就是知道自己一无所知。", origin: "Socrate" },
  // Monde
  { text: "Seul on va plus vite, ensemble on va plus loin.", zh: "一个人走得快，一群人走得远。", origin: "Proverbe africain" },
  { text: "Tombe sept fois, relève-toi huit.", zh: "七转八起。", origin: "Proverbe japonais" },
  { text: "Un arbre qui tombe fait beaucoup de bruit, une forêt qui pousse n'en fait aucun.", zh: "倒下的大树轰然作响，生长的森林寂静无声。", origin: "Proverbe africain" },
  { text: "La douceur triomphe de la dureté.", zh: "柔能克刚。", origin: "Proverbe tibétain" },
  { text: "Ne jugez pas un grain de poivre d'après sa petite taille, goûtez-le et vous sentirez son piquant.", zh: "莫以胡椒小而轻之，尝之方知其辣。", origin: "Proverbe arabe" },
  { text: "Le meilleur moment pour planter un arbre était il y a 20 ans. Le deuxième meilleur moment est maintenant.", zh: "种一棵树最好的时间是二十年前，其次是现在。", origin: "Proverbe africain" },
  { text: "Ce n'est pas la destination qui compte, c'est le voyage.", zh: "重要的不是目的地，而是沿途的风景。", origin: "Robert Louis Stevenson" }
];

export function ProverbBar() {
  const [isOpen, setIsOpen] = useState(true);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Auto-hide after 5s
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      timer = setTimeout(() => {
        setIsOpen(false);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Change quote every 2 minutes (120000 ms)
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
    }, 120000);
    return () => clearInterval(interval);
  }, []);

  const currentQuote = QUOTES[quoteIndex];

  return (
    <div className="fixed left-0 top-1/3 -translate-y-1/2 z-[100] flex items-center pointer-events-none">
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="open"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-zinc-900/90 backdrop-blur-md text-white p-5 rounded-r-3xl shadow-2xl flex flex-col gap-3 cursor-pointer pointer-events-auto border border-zinc-800/50 border-l-0 max-w-[250px] sm:max-w-xs"
            onClick={() => setIsOpen(false)}
          >
            <Quote size={20} className="text-emerald-400 opacity-50" />
            <div className="flex flex-col gap-2">
              <p className="text-sm sm:text-base font-medium leading-relaxed italic text-zinc-100">
                "{currentQuote.text}"
              </p>
              <p className="text-sm sm:text-base font-medium leading-relaxed text-emerald-100/90">
                "{currentQuote.zh}"
              </p>
            </div>
            <p className="text-xs text-zinc-400 font-bold tracking-wider uppercase text-right mt-1">
              — {currentQuote.origin}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="closed"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-4 h-32 bg-transparent hover:bg-zinc-900/10 rounded-r-xl flex items-center justify-start cursor-pointer transition-colors pointer-events-auto"
            onClick={() => setIsOpen(true)}
          >
            <div className="w-1 h-16 bg-zinc-400/30 rounded-r-full" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
