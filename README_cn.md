## Gap-Graph使用说明

### 1、软件介绍

Gap-Graph是一款辅助基因组组装的可视化软件，该软件提供了基因组组装图可视化、染色体可视化、基因组gap区域定位及可视化、基因组gap区域填补、多倍体手动分型等功能，可以帮助研究人员快速高效的完成基因组gap的填补。

### 2、安装

用户可以通过以下链接来下载和安装Gap-Graph，双击安装即可，下载链接为：https://github.com/panlab-bioinfo/Gap-graph/releases

### 3、软件使用说明

##### Pre require：

[Minimap2](https://github.com/lh3/minimap2) >= 2.26-r1175

[GraphAligner](https://github.com/maickrau/GraphAligner) >= 1.0.13

[HapHic](https://github.com/zengxiaofei/HapHiC) >= 1.0.6

[bwa](https://github.com/lh3/bwa) >= 0.7.18-r1243-dirty

[samblaster](https://github.com/GregoryFaust/samblaster) >= 0.1.26

[samtools](https://github.com/samtools/samtools) >= 1.20

![figure1](./images/1.png)  

1、  想要正常使用补gap功能，黄色按钮是必须要上传的文件：

   1）.gfa文件：.gfa文件是使用自动化组装软件（hifiasm、flye）组装出来的unitig组装图文件（推荐hifiasm）；

   2）.fa文件：.fa文件中使用自动化组装软件组装出来的染色体级别的组装结果，该文件只支持单行的fasta格式，即，第一行为>name, 第二行为序列，序列仅仅放到第二行；
   
```
# example fa format
>id1_seq
AATTCTCTTGCTCGCTGCT
>id2_seq
CGCGCGGCTCTCTTTC
......
```

   3）.paf文件：.paf文件是使用minimap2将unitig序列比对到chromosome assembly上的比对结果。

可以使用以下命令获取.paf文件，记得更换正确的文件路径：

```
minimap2 -x asm5 -t 32 assembly.fa unitig.fa > result.paf
```

2、  如果想看更多的信息，可以上传.gaf文件和Hi-C文件：

   1）.gaf文件：.gaf文件是使用GraphAligner将ont reads比对到unitig组装图上的比对结果；

可以使用以下命令获取.gaf文件，记得更换正确的文件路径：

```
GraphAligner -g unitig.gfa -f ont.fa -a result.gaf -x vg
```

   2）Hi-C（.txt）文件：.txt 文件是使用bwa将Hi-C数据与unitig序列进行比对并过滤（此处参考的是HapHic的过滤方法）之后得到的结果，其中第一，二列为utg的ID，第三列为hic信号量。

可以使用以下命令获取.txt文件，记得更换正确的文件路径：

```
bwa mem -5SP -t 28 unitig.fa ont.read1_fq ont.read2_fq | samblaster | samtools view - -@ 14 -S -h -b -F 3340 -o HiC.bam

filter_bam HiC.bam 1 --nm 3 --threads 14 | samtools view - -b -@ 14 -o HiC.filtered.bam

samtools view HiC.filtered.bam | awk '($7 != "=" && $3 != $7 )' | cut -f1,3,7 |awk '{if($1 != seq){seq=$1;print $0;}}'| awk '{if($2>$3){temp=$2;$2=$3;$3=temp}print $2"\t"$3}' | sort | uniq -c | awk '{print $2","$3","$1}' > hic.txt
```



 

![figure2](./images/2.png)  



3、 上传.gfa文件后，会自动可视化组装图，如下图：

![figure3](./images/3.png)  

 

4、 上传.paf文件后软件会自动将chromosome assembly对齐到组装图上，然后可选择染色体ID去查看每一条染色体，若个别染色未挂载成功或不满意，可手动开起优化算法，选择想要优化的一条或多条染色体后，再次上传.paf文件，即可对染色体进行优化挂载

 

![figure4](./images/4.png)  



5、 .paf文件上传后，“All gaps info”卡片会展示chromosome assembly中所有的gap信息，如下图：

![figure5](./images/5.png)  

 

6、 .paf文件上传后，点击“show chromosomes”按钮可显示已挂载的染色体，并且会在图中显示出gap的位置（红色节点为gap区域的开始和结束）；也可以选择一个染色体单独显示

注意：图中显示出来的gap数量可能会少于“All gaps info”卡片中展示的gap数量

![figure6](./images/6.png)  



7、 鼠标放到节点上，会显示节点的标签，标签的第一个字段是utg的ID，第二个字段是utg的长度，第三个字段是该utg在当前染色体中的位置，如下图：

![figure7](./images/7.png)  

 

8、 .gaf文件上传后，点击“show path”按钮会显示每条路径的深度，如下图：

![figure8](./images/8.png)  



9、 .gaf文件上传后，鼠标右击节点，点击“show cover degree”按钮会显示其他节点（紫色）与当前节点（黄色）的覆盖度，其他节点颜色越深表示覆盖度越深，如下图：

![figure9](./images/9.png)  

 

10、      Hi-C（.txt）文件上传后，鼠标右击节点，点击“show Hi-C”按钮会显示其他节点（蓝色）与当前节点（黄色）的Hi-C信号量，其他节点颜色越深表示信号越强，如下图：

![figure10](./images/10.png)  



11、      当选择一条染色体后，点击染色体中的某个节点，界面右侧会显示与该节点相关的边信息以及比对信息，如下图：

![figure11](./images/11.png)  

 

12、      界面右上角的输入框，可以输入你想查询的节点（若查询多个节点，节点之间用逗号分隔），点击查询按钮，节点会高亮显示在图中，如下图：

![figure12](./images/12.png)  



### 4、核心功能说明

1、 Fill gap：找到所要填补的gap位置（红色节点），将挂载顺序较小的节点添加到开始节点，挂载顺序较大的添加到结束节点，接下来按顺序添加（ctrl+左击节点）要填补的节点，然后点击“add”按钮，即完成一个gap信息的添加，若一条染色体中多个gap需要填补，请重复上述步骤，直到所有的gap信息都被添加，最后点击“fill gap”按钮，即可完成gap的填补。
 注意：

1）若不知道添加哪些节点去填补gap，可上传.gaf文件或Hi-C(.txt)文件，以显示更多的信息进行参考，选择最可靠的一条路径。

2）生成的序列会保存到与上传的.fa文件相同的目录下

2、 Merger：该功能可根据添加的节点信息将所有的utg序列进行拼接，同样是需要添加开始和结束节点，并按顺序添加要拼接的节点（ctrl+左击节点），然后直接点击“merger”按钮即可完成拼接。该功能可用来分型（根据一些信息，比如上传.gaf文件或Hi-C(.txt)文件，选择一条可靠的路径，并将其拼接成更长的序列）。