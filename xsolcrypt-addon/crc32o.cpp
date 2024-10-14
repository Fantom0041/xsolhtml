#include "gcc_defs.h"
#include "crc32o.h"

bool crc32o::table_init=false;
unsigned int  crc32o::crc32tab[256];

crc32o::crc32o(unsigned int c2)
{
	crc32=c2;
	if(!table_init) make_table();
}


void crc32o::make_table(void)
{
  int i, inx;
  unsigned int  carry32;
  unsigned int  entry32;

  for (inx = 0; inx < 256; ++inx)
  {
    entry32 = inx;

    for (i = 0; i < 8; ++i)
    {
      carry32 = entry32 & 1;
      entry32 >>= 1;
      if (carry32)
        entry32 ^= 0xedb88320;
    }
    crc32tab[inx] = entry32;
  }
  table_init = true;  
}

void crc32o::put(unsigned char b)
{
	put(&b,1 );
}


void crc32o::put(const unsigned char *buf,int count )
{
  int i;
  unsigned char inx32;

  if (count == 0)
    return;

  for (i = 0; i < count; ++i)
  {
    inx32 = buf[i] ^ crc32;
    crc32 >>= 8;
    crc32 ^= crc32tab[inx32];
  }
}
