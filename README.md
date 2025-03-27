## Gap-Graph使用说明

### 1、软件介绍

Gap-Graph是一款辅助基因组组装的可视化软件，该软件提供了基因组组装图可视化、染色体可视化、基因组gap区域定位及可视化、基因组gap区域填补、多倍体手动分型等功能，可以帮助研究人员快速高效的完成基因组gap的填补。

### 2、安装

用户可以通过以下链接来下载和安装Gap-Graph，双击安装即可，下载链接为：https://github.com/panlab-bioinfo/Gap-graph

### 3、软件使用说明

##### Pre require：

[Minimap2](https://github.com/lh3/minimap2) >= 2.26-r1175

[GraphAligner](https://github.com/maickrau/GraphAligner) >= 1.0.13

[HapHic](https://github.com/zengxiaofei/HapHiC) >= 1.0.6

[bwa](https://github.com/lh3/bwa) >= 0.7.18-r1243-dirty

[samblaster](https://github.com/GregoryFaust/samblaster) >= 0.1.26

[samtools](https://github.com/samtools/samtools) >= 1.20

![figure1](./image/1.png)  

1、  想要正常使用补gap功能，黄色按钮是必须要上传的文件：

   1）.gfa文件：.gfa文件是使用自动化组装软件（hifiasm、flye）组装出来的unitig组装图文件（推荐hifiasm）；

   2）.fa文件：.fa文件中使用自动化组装软件组装出来的chromosome assembly（推荐hifiasm）；

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



 

![figure2](./image/2.png)  



3、 上传.gfa文件后，会自动可视化组装图，如下图：

![figure3](./image/3.png)  

 

4、 上传.paf文件后软件会自动将chromosome assembly对齐到组装图上，然后可选择染色体ID去查看每一条染色体，若个别染色未挂载成功或不满意，可手动开起优化算法，选择想要优化的一条或多条染色体后，再次上传.paf文件，即可对染色体进行优化挂载

 

![figure4](./image/4.png)  



5、 .paf文件上传后，“All gaps info”卡片会展示chromosome assembly中所有的gap信息，如下图：

![figure5](./image/5.png)  

 

6、 .paf文件上传后，点击“show chromosomes”按钮可显示已挂载的染色体，并且会在图中显示出gap的位置（红色节点为gap区域的开始和结束）；也可以选择一个染色体单独显示

注意：图中显示出来的gap数量可能会少于“All gaps info”卡片中展示的gap数量

![figure6](./image/6.png)  



7、 鼠标放到节点上，会显示节点的标签，标签的第一个字段是utg的ID，第二个字段是utg的长度，第三个字段是该utg在当前染色体中的位置，如下图：

![figure7](./image/7.png)  

 

8、 .gaf文件上传后，点击“show path”按钮会显示每条路径的深度，如下图：

![figure8](./image/8.png)  



9、 .gaf文件上传后，鼠标右击节点，点击“show cover degree”按钮会显示其他节点（紫色）与当前节点（黄色）的覆盖度，其他节点颜色越深表示覆盖度越深，如下图：

![figure9](./image/9.png)  

 

10、      Hi-C（.txt）文件上传后，鼠标右击节点，点击“show Hi-C”按钮会显示其他节点（蓝色）与当前节点（黄色）的Hi-C信号量，其他节点颜色越深表示信号越强，如下图：

![figure10](./image/10.png)  



11、      当选择一条染色体后，点击染色体中的某个节点，界面右侧会显示与该节点相关的边信息以及比对信息，如下图：

![figure11](./image/11.png)  

 

12、      界面右上角的输入框，可以输入你想查询的节点（若查询多个节点，节点之间用逗号分隔），点击查询按钮，节点会高亮显示在图中，如下图：

![figure12](./image/12.png)  



### 4、核心功能说明

1、 Fill gap：找到所要填补的gap位置（红色节点），将挂载顺序较小的节点添加到开始节点，挂载顺序较大的添加到结束节点，接下来按顺序添加（ctrl+左击节点）要填补的节点，然后点击“add”按钮，即完成一个gap信息的添加，若一条染色体中多个gap需要填补，请重复上述步骤，直到所有的gap信息都被添加，最后点击“fill gap”按钮，即可完成gap的填补。
 注意：

1）若不知道添加哪些节点去填补gap，可上传.gaf文件或Hi-C(.txt)文件，以显示更多的信息进行参考，选择最可靠的一条路径。

2）生成的序列会保存到与上传的.fa文件相同的目录下

2、 Merger：该功能可根据添加的节点信息将所有的utg序列进行拼接，同样是需要添加开始和结束节点，并按顺序添加要拼接的节点（ctrl+左击节点），然后直接点击“merger”按钮即可完成拼接。该功能可用来分型（根据一些信息，比如上传.gaf文件或Hi-C(.txt)文件，选择一条可靠的路径，并将其拼接成更长的序列）。



 

## Gap-Graph User Guide

### 1、Software Introduction

Gap-Graph is a visual tool designed to assist in genome assembly. It provides functionalities for visualizing genome assembly graphs, chromosome visualizations, locating and visualizing genomic gap regions, gap filling, and manual genotyping of polyploid genomes. This software can help researchers quickly and efficiently complete the filling of genomic gaps.

### 2、Installation

Users can download and install Gap-Graph through the following link. Simply double-click to install. The download link is: https://github.com/panlab-bioinfo/Gap-graph

### 3、Software Usage Instructions

##### Pre require：

[Minimap2](https://github.com/lh3/minimap2) >= 2.26-r1175

[GraphAligner](https://github.com/maickrau/GraphAligner) >= 1.0.13

[HapHic](https://github.com/zengxiaofei/HapHiC) >= 1.0.6

[bwa](https://github.com/lh3/bwa) >= 0.7.18-r1243-dirty

[samblaster](https://github.com/GregoryFaust/samblaster) >= 0.1.26

[samtools](https://github.com/samtools/samtools) >= 1.20

![figure1](./image/1.png)  

 

1、  To properly use the gap-filling function, the yellow button requires the following uploaded files:

   1）.gfa file: The .gfa file is the unitig assembly graph file generated using an automated assembly software (such as hifiasm or flye, hifiasm is recommended).

   2）.fa file: The .fa file contains the chromosome assembly generated by the automated assembly software.

   3）.paf file: The .paf file is the alignment result of the unitig sequences mapped to the chromosome assembly using minimap2.

You can use the following command to obtain the .paf file. Be sure to replace the file paths with the correct ones:

```
minimap2 -x asm5 -t 32 assembly.fa unitig.fa > result.paf
```

2、  If you want to view more information, you can upload the .gaf file and Hi-C file:

   1）.gaf file: The .gaf file is the alignment result of ONT reads mapped to the unitig assembly graph using GraphAligner.

You can use the following command to obtain the .gaf file. Be sure to replace the file paths with the correct ones:

```
GraphAligner -g unitig.gfa -f ont.fa -a result.gaf -x vg
```

   2）Hi-C (.txt) file: The .txt file contains the result of aligning and filtering Hi-C data against the unitig sequences using bwa (here, the filtering method of HapHic is referenced). The first and second columns contain the utg IDs, and the third column contains the Hi-C signal values.

You can use the following command to obtain the .txt file. Be sure to replace the file paths with the correct ones:

```
bwa mem -5SP -t 28 unitig.fa ont.read1_fq ont.read2_fq | samblaster | samtools view - -@ 14 -S -h -b -F 3340 -o HiC.bam

 

filter_bam HiC.bam 1 --nm 3 --threads 14 | samtools view - -b -@ 14 -o HiC.filtered.bam

 

samtools view HiC.filtered.bam | awk '($7 != "=" && $3 != $7 )' | cut -f1,3,7 |awk '{if($1 != seq){seq=$1;print $0;}}'| awk '{if($2>$3){temp=$2;$2=$3;$3=temp}print $2"\t"$3}' | sort | uniq -c | awk '{print $2","$3","$1}' > hic.txt
```

![figure2](./image/2.png)  

 

3、 After uploading the .gfa file, the assembly graph will be automatically visualized, as shown in the image below:

![figure3](./image/3.png)  

 

4、After uploading the .paf file, the software will automatically align the chromosome assembly to the assembly graph. You can then select the chromosome ID to view each chromosome. If some chromosomes are not successfully mounted or are unsatisfactory, you can manually enable the optimization algorithm. After selecting one or more chromosomes you wish to optimize, re-upload the .paf file to optimize the chromosome mounting.

![figure4](./image/4.png)  

 

5、After uploading the .paf file, the "All gaps info" card will display all the gap information in the chromosome assembly, as shown in the image below:

![figure5](./image/5.png)  

 

6、 After uploading the .paf file, click the "show chromosomes" button to display the mounted chromosomes, and the positions of gaps will be shown on the graph (red nodes represent the start and end of the gap areas). You can also choose to display a single chromosome.

Note: The number of gaps displayed on the graph may be fewer than the number of gaps shown in the "All gaps info" card.

![figure6](./image/6.png)  

 

7、 When you hover the mouse over a node, the node's label will be displayed. The first field of the label is the utg ID, the second field is the length of the utg, and the third field is the position of the utg on the current chromosome, as shown in the image below:

![figure7](./image/7.png)  

 

8、After uploading the .gaf file, click the "show path" button to display the depth of each path, as shown in the image below:

![figure8](./image/8.png)  



9、After upoading the .gaf file, right-click on a node and click the "show cover degree" button to display the coverage degree of other nodes (purple) relative to the current node (yellow). The darker the color of the other nodes, the higher the coverage degree, as shown in the image below:

![figure9](./image/9.png)  



10、 After uploading the Hi-C (.txt) file, right-click on a node and click the "show Hi-C" button to display the Hi-C signal strength between other nodes (blue) and the current node (yellow). The darker the color of the other nodes, the stronger the signal, as shown in the image below:

![figure10](./image/10.png)  


11、 After selecting a chromosome, click on a node within the chromosome, and the edge information and alignment details related to that node will be displayed on the right side of the interface, as shown in the image below:

![figure11](./image/11.png)  

 

12、 The input box in the top-right corner of the interface allows you to enter the nodes you want to search for (if searching for multiple nodes, separate them with commas). After clicking the search button, the nodes will be highlighted in the graph, as shown in the image below:

![figure12](./image/12.png)  



### 4、Core Functionality Description**

1、 fill gap: Find the gap position to be filled (red node). Add nodes with smaller mounting order to the starting node, and nodes with larger mounting order to the ending node. Then, sequentially add the nodes to be filled by pressing "ctrl + left-click" on the nodes. Afterward, click the "add" button to complete the addition of the gap information. If multiple gaps need to be filled in a chromosome, repeat the above steps until all gap information is added. Finally, click the "fill gap" button to complete the gap filling.

Note:

   1）If you're unsure which nodes to add to fill the gap, you can upload the .gaf or Hi-C (.txt) files to display more information for reference, and choose the most reliable path.

   2）The generated sequence will be saved in the same directory as the uploaded .fa file.

2、 merger: This function allows for the merging of all utg sequences based on the added node information. It similarly requires adding the start and end nodes, and then sequentially adding the nodes to be merged (ctrl + left-click on the nodes). Afterward, simply click the "merger" button to complete the merging process. This function can be used for genotyping (based on certain information, such as uploading .gaf or Hi-C (.txt) files, choosing a reliable path, and merging it into a longer sequence).

 
